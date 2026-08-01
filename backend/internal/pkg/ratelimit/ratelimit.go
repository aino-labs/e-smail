package ratelimit

import (
	"strings"
	"sync"
	"time"
)

type Config struct {
	Rate      float64
	Burst     float64
	MaxFails  int
	BaseBlock time.Duration
	MaxBlock  time.Duration
	TTL       time.Duration
}

func (c Config) withDefaults() Config {
	if c.Rate <= 0 {
		c.Rate = 0.2
	}
	if c.Burst <= 0 {
		c.Burst = 10
	}
	if c.MaxFails <= 0 {
		c.MaxFails = 5
	}
	if c.BaseBlock <= 0 {
		c.BaseBlock = time.Minute
	}
	if c.MaxBlock <= 0 {
		c.MaxBlock = time.Hour
	}
	if c.TTL <= 0 {
		c.TTL = 24 * time.Hour
	}
	return c
}

const (
	maxEntries = 100_000
	maxShift   = 20
)

type bucket struct {
	tokens float64
	last   time.Time
}

type failure struct {
	count int
	until time.Time
	seen  time.Time
}

type Guard struct {
	cfg     Config
	mu      sync.Mutex
	buckets map[string]*bucket
	fails   map[string]*failure
	stop    chan struct{}
}

func New(cfg Config) *Guard {
	g := &Guard{
		cfg:     cfg.withDefaults(),
		buckets: make(map[string]*bucket),
		fails:   make(map[string]*failure),
		stop:    make(chan struct{}),
	}
	go g.janitor()
	return g
}

func (g *Guard) Close() {
	if g == nil {
		return
	}
	close(g.stop)
}

func (g *Guard) Allow(key string) bool {
	if g == nil || key == "" {
		return true
	}

	now := time.Now()

	g.mu.Lock()
	defer g.mu.Unlock()

	if len(g.buckets) >= maxEntries {
		g.sweepLocked(now)
	}

	b, ok := g.buckets[key]
	if !ok {
		b = &bucket{tokens: g.cfg.Burst, last: now}
		g.buckets[key] = b
	}

	b.tokens += now.Sub(b.last).Seconds() * g.cfg.Rate
	if b.tokens > g.cfg.Burst {
		b.tokens = g.cfg.Burst
	}
	b.last = now

	if b.tokens < 1 {
		return false
	}

	b.tokens--
	return true
}

func (g *Guard) Blocked(keys ...string) (time.Duration, bool) {
	if g == nil {
		return 0, false
	}

	now := time.Now()

	g.mu.Lock()
	defer g.mu.Unlock()

	var longest time.Duration
	for _, k := range keys {
		f, ok := g.fails[k]
		if !ok {
			continue
		}
		if d := f.until.Sub(now); d > longest {
			longest = d
		}
	}

	return longest, longest > 0
}

func (g *Guard) Fail(keys ...string) {
	if g == nil {
		return
	}

	now := time.Now()

	g.mu.Lock()
	defer g.mu.Unlock()

	if len(g.fails) >= maxEntries {
		g.sweepLocked(now)
	}

	for _, k := range keys {
		if k == "" {
			continue
		}

		f, ok := g.fails[k]
		if !ok {
			f = &failure{}
			g.fails[k] = f
		}

		f.count++
		f.seen = now

		if f.count < g.cfg.MaxFails {
			continue
		}

		shift := f.count - g.cfg.MaxFails
		if shift > maxShift {
			shift = maxShift
		}

		d := g.cfg.BaseBlock << uint(shift)
		if d <= 0 || d > g.cfg.MaxBlock {
			d = g.cfg.MaxBlock
		}
		f.until = now.Add(d)
	}
}

func (g *Guard) Reset(keys ...string) {
	if g == nil {
		return
	}

	g.mu.Lock()
	defer g.mu.Unlock()

	for _, k := range keys {
		delete(g.fails, k)
	}
}

func (g *Guard) janitor() {
	t := time.NewTicker(g.cfg.TTL / 4)
	defer t.Stop()

	for {
		select {
		case <-g.stop:
			return
		case now := <-t.C:
			g.mu.Lock()
			g.sweepLocked(now)
			g.mu.Unlock()
		}
	}
}

func (g *Guard) sweepLocked(now time.Time) {
	for k, b := range g.buckets {
		if now.Sub(b.last) > g.cfg.TTL {
			delete(g.buckets, k)
		}
	}

	for k, f := range g.fails {
		if now.Sub(f.seen) > g.cfg.TTL && now.After(f.until) {
			delete(g.fails, k)
		}
	}
}

func IPKey(ip string) string {
	if ip == "" {
		return ""
	}
	return "ip:" + ip
}

func AccountKey(email string) string {
	email = strings.ToLower(strings.TrimSpace(email))
	if email == "" {
		return ""
	}
	return "acct:" + email
}
