package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"errors"
	"io"

	"golang.org/x/crypto/hkdf"
)

var ErrMasterKeyLength = errors.New("master key is not of length 32")

type Encryptor struct {
	kekGCM cipher.AEAD
}

func New(masterKey []byte) (*Encryptor, error) {
	if len(masterKey) != 32 {
		return nil, ErrMasterKeyLength
	}

	// Create AES-256 Key Encryption Key (KEK)
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

func (e *Encryptor) Encrypt(plaintext []byte) ([]byte, []byte, error) {
	// Fill Data Encryption Key (DEK) length 32 with random values
	dek := make([]byte, 32)
	_, err := rand.Read(dek)
	if err != nil {
		return nil, nil, errors.New("failed to read DEK")
	}

	block, err := aes.NewCipher(dek)
	if err != nil {
		return nil, nil, errors.New("failed to create cipher for block")
	}

	blockGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, nil, errors.New("failed to create GCM for block")
	}

	encryptedText, err := seal(blockGCM, plaintext)
	if err != nil {
		return nil, nil, errors.New("failed to seal the block")
	}

	wrappedDEK, err := seal(e.kekGCM, dek)
	if err != nil {
		return nil, nil, errors.New("failed to wrapp (seal) the DEK")
	}

	return encryptedText, wrappedDEK, nil
}

func (e *Encryptor) Decrypt(ciphertext []byte, wrappedDEK []byte) ([]byte, error) {
	dek, err := open(e.kekGCM, wrappedDEK)
	if err != nil {
		return nil, errors.New("failed to open wrapped DEK")
	}

	block, err := aes.NewCipher(dek)
	if err != nil {
		return nil, errors.New("failed to create new cipher")
	}

	blockGCM, err := cipher.NewGCM(block)
	if err != nil {
		return nil, errors.New("failed to create GCM for block")
	}

	decryptedText, err := open(blockGCM, ciphertext)
	if err != nil {
		return nil, errors.New("failed to decrypt ciphertext")
	}

	return decryptedText, nil
}

func seal(gcm cipher.AEAD, plaintext []byte) ([]byte, error) {
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, errors.New("failed to allocate nonce")
	}

	return gcm.Seal(nonce, nonce, plaintext, nil), nil
}

func open(gcm cipher.AEAD, blob []byte) ([]byte, error) {
	nonce := blob[:gcm.NonceSize()]
	ciphertext := blob[gcm.NonceSize():]

	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	return plaintext, nil
}
