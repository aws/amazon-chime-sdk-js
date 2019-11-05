This package contains the Rust source code for the WebAssembly JPEG decoder library which allows for quickly decoding JPEG data without needing to create heavyweight DOM objects like `img` tags or `Blob` data. To update `JPEGDecoderModule.ts`:

```
brew install rust
rustup update
./compile
```

Open the generated `example.html` file to check the JPEG decoder in a browser.
