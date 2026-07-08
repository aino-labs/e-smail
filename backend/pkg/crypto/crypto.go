package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/sha256"
	"errors"
	"io"

	"golang.org/x/crypto/hkdf"
)

var (
	MasterKeyLengthErr = errors.New("kek is not 32 bytes length")
)

type Encryptor struct {
	kekGCM cipher.AEAD
}

func New(masterKey []byte) (*Encryptor, error) {
	if len(masterKey) != 32 {
		return nil, MasterKeyLengthErr
	}

	kek := make([]byte, 32)
	if _, err := io.ReadFull(hkdf.New(sha256.New, masterKey, nil, []byte("kek-v1")), kek); err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(kek)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	return &Encryptor{
		kekGCM: gcm,
	}, nil
}

func EncryptText(text string, dek string) {}

func DecryptText(text string, dek string) {}
