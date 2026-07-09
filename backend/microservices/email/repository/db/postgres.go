package repository

import (
	"context"
	"database/sql"
	"smail/pkg/crypto"
)

type Repository struct {
	db        *sql.DB
	encryptor *crypto.Encryptor
}

func New(db *sql.DB, encryptor *crypto.Encryptor) *Repository {
	return &Repository{
		db:        db,
		encryptor: encryptor,
	}
}

func (r *Repository) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return r.db.BeginTx(ctx, nil)
}
