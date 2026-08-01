package middleware

import (
	"net"
	"net/http"
	"time"

	"smail/internal/pkg/ratelimit"
	"smail/internal/pkg/response"
)

const bucketRetryAfter = 30 * time.Second

func RateLimit(g *ratelimit.Guard, trusted []*net.IPNet) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := ClientIP(r, trusted)

			if !g.Allow(ratelimit.IPKey(ip)) {
				GetLogger(r.Context()).Warnf(
					"rate limit exceeded: %s %s from %s",
					r.Method, r.URL.Path, ip,
				)
				response.TooManyRequests(w, bucketRetryAfter)
				return
			}

			next.ServeHTTP(w, r.WithContext(ContextWithClientIP(r.Context(), ip)))
		})
	}
}
