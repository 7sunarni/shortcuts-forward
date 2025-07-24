package main

/*

rm main.wasm wasm_exec.js

GOARCH=wasm GOOS=js go build -o main.wasm

cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" .
*/

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"encoding/hex"
	"fmt"
	"syscall/js"
)

func addFunction(this js.Value, p []js.Value) interface{} {
	sum := p[0].Int() + p[1].Int()
	return js.ValueOf(sum)
}


func main() {
	c := make(chan struct{}, 0)

	js.Global().Set("add", js.FuncOf(addFunction))
	js.Global().Set("aes256Decode", js.FuncOf(aes256Decode))
	js.Global().Set("aes256Encode", js.FuncOf(aes256Encode))

	<-c
}

func aes256Decode(this js.Value, p []js.Value) interface{} {
	if len(p) < 2 {
		return "missing parameter"
	}
	key := p[0].String()
	value := p[1].String()
	fmt.Println("key:", key, "value:", value)

	return Ase256Decode(value, key, key)
}

func aes256Encode(this js.Value, p []js.Value) interface{} {
	if len(p) < 2 {
		return "missing parameter"
	}
	key := p[0].String()
	value := p[0].String()

	return Ase256Encode(value, key, key, aes.BlockSize)
}

func Ase256Encode(plaintext string, key string, iv string, blockSize int) string {
	bKey := []byte(key)
	bIV := []byte(iv)
	bPlaintext := PKCS5Padding([]byte(plaintext), blockSize, len(plaintext))
	block, err := aes.NewCipher(bKey)
	if err != nil {
		panic(err)
	}
	ciphertext := make([]byte, len(bPlaintext))
	mode := cipher.NewCBCEncrypter(block, bIV)
	mode.CryptBlocks(ciphertext, bPlaintext)
	return hex.EncodeToString(ciphertext)
}

func Ase256Decode(cipherText string, encKey string, iv string) (decryptedString string) {
	bKey := []byte(encKey)
	bIV := []byte(iv)
	cipherTextDecoded, err := hex.DecodeString(cipherText)
	if err != nil {
		panic(err)
	}

	block, err := aes.NewCipher(bKey)
	if err != nil {
		panic(err)
	}

	mode := cipher.NewCBCDecrypter(block, bIV)
	mode.CryptBlocks([]byte(cipherTextDecoded), []byte(cipherTextDecoded))
	return string(cipherTextDecoded)
}

func PKCS5Padding(ciphertext []byte, blockSize int, after int) []byte {
	padding := (blockSize - len(ciphertext)%blockSize)
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(ciphertext, padtext...)
}
