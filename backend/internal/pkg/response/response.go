package response

import (
	"fmt"
	"math"
	"net/http"
	"strconv"
	"time"
)

type ErrorResponse struct {
	Message string `json:"message"`
}

func BadRequest(w http.ResponseWriter) {
	w.WriteHeader(http.StatusBadRequest)
	_, _ = fmt.Fprintf(w, `{ "error": "Bad request" }`)
}

func Unauthorized(w http.ResponseWriter) {
	w.WriteHeader(http.StatusUnauthorized)
	_, _ = fmt.Fprintf(w, `{ "error": "Unauthorized" }`)
}

func InternalError(w http.ResponseWriter) {
	w.WriteHeader(http.StatusInternalServerError)
	_, _ = fmt.Fprintf(w, `{ "error": "Internal server error" }`)
}

func StatusConflict(w http.ResponseWriter) {
	w.WriteHeader(http.StatusConflict)
	_, _ = fmt.Fprintf(w, `{ "error": "Already exsist" }`)
}

func Forbidden(w http.ResponseWriter) {
	w.WriteHeader(http.StatusForbidden)
	_, _ = fmt.Fprintf(w, `{ "error": "Don't have access" }`)
}

func NotFound(w http.ResponseWriter) {
	w.WriteHeader(http.StatusNotFound)
	_, _ = fmt.Fprintf(w, `{ "error": "Not found" }`)
}

func TooManyRequests(w http.ResponseWriter, retryAfter time.Duration) {
	if retryAfter > 0 {
		w.Header().Set("Retry-After", strconv.Itoa(int(math.Ceil(retryAfter.Seconds()))))
	}
	w.WriteHeader(http.StatusTooManyRequests)
	_, _ = fmt.Fprintf(w, `{ "error": "Too many requests" }`)
}

func NotFoundWithMessage(w http.ResponseWriter, msg string) {
	w.WriteHeader(http.StatusNotFound)
	_, _ = fmt.Fprintf(w, `{ "error": %q }`, msg)
}
