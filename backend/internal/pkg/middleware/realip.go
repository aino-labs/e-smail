package middleware

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"strings"
)

const ClientIPKey contextKey = "client_ip"

func ClientIP(r *http.Request, trusted []*net.IPNet) string {
	peer := remoteIP(r.RemoteAddr)
	if peer == nil {
		return ""
	}

	if !inNets(peer, trusted) {
		return peer.String()
	}

	parts := strings.Split(r.Header.Get("X-Forwarded-For"), ",")
	for i := len(parts) - 1; i >= 0; i-- {
		ip := net.ParseIP(strings.TrimSpace(parts[i]))
		if ip == nil {
			continue
		}
		if !inNets(ip, trusted) {
			return ip.String()
		}
	}

	return peer.String()
}

func remoteIP(remoteAddr string) net.IP {
	host, _, err := net.SplitHostPort(remoteAddr)
	if err != nil {
		host = remoteAddr
	}
	return net.ParseIP(host)
}

func inNets(ip net.IP, nets []*net.IPNet) bool {
	for _, n := range nets {
		if n != nil && n.Contains(ip) {
			return true
		}
	}
	return false
}

func ParseCIDRs(cidrs []string) ([]*net.IPNet, error) {
	out := make([]*net.IPNet, 0, len(cidrs))
	for _, c := range cidrs {
		_, n, err := net.ParseCIDR(strings.TrimSpace(c))
		if err != nil {
			return nil, fmt.Errorf("invalid trusted proxy cidr %q: %w", c, err)
		}
		out = append(out, n)
	}
	return out, nil
}

func ContextWithClientIP(ctx context.Context, ip string) context.Context {
	return context.WithValue(ctx, ClientIPKey, ip)
}

func ClientIPFromContext(ctx context.Context) string {
	ip, _ := ctx.Value(ClientIPKey).(string)
	return ip
}
