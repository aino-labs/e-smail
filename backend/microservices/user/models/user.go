package models

import "time"

type Folder struct {
	ID   int64
	Name string
}

type User struct {
	ID        int64
	Email     string
	Password  string
	Name      string
	Surname   string
	ImagePath string
	IsMale    *bool
	Birthdate *time.Time

	// AcceptAnonymous — указатель, чтобы различать "не задано в запросе" и
	// "явно выставлено false" в UpdateProfile (PATCH-семантика, как у IsMale).
	// В БД колонка NOT NULL DEFAULT false, поэтому на чтении здесь всегда
	// лежит конкретное значение; nil бывает только во входных данных апдейта.
	AcceptAnonymous *bool

	Folders []Folder
}
