use jpeg_decoder::Decoder;
use std::io::Cursor;
use std::slice;
use wasm_bindgen::prelude::*;

const RGBA_BYTES: usize = 4;

#[wasm_bindgen(start)]
pub fn main() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

#[wasm_bindgen]
pub struct JpegDecoderInput {
    jpeg_in: Vec<u8>,
}

#[wasm_bindgen]
impl JpegDecoderInput {
    pub fn new(size: usize) -> JpegDecoderInput {
        let jpeg_in: Vec<u8> = vec![0; size];
        JpegDecoderInput { jpeg_in }
    }

    pub fn input_ptr(&mut self) -> *mut u8 {
        self.jpeg_in.as_mut_ptr()
    }
}

#[wasm_bindgen]
pub struct JpegDecoder {
    rgba_out: Vec<u8>,
    width: u16,
    height: u16,
}

#[wasm_bindgen]
impl JpegDecoder {
    pub fn new(width: usize, height: usize) -> JpegDecoder {
        let rgba_out: Vec<u8> = vec![0; width * height * RGBA_BYTES];
        JpegDecoder {
            rgba_out,
            width: 0,
            height: 0,
        }
    }

    pub fn output_ptr(&self) -> *const u8 {
        self.rgba_out.as_ptr()
    }

    pub fn decode(&mut self, in_buffer: *const u8, in_bytes: usize) -> bool {
        let slice = unsafe { slice::from_raw_parts(in_buffer, in_bytes) };
        let cursor = Cursor::new(&slice);
        let mut decoder = Decoder::new(cursor);
        self.width = 0;
        self.height = 0;
        let rgb_decoded = match decoder.decode() {
            Err(_) => return false,
            Ok(f) => f,
        };
        let metadata = match decoder.info() {
            None => return false,
            Some(f) => f,
        };
        self.width = metadata.width;
        self.height = metadata.height;
        let mut i: usize = 0;
        let mut j: usize = 0;
        let n: usize = rgb_decoded.len();
        let rgba_out = &mut self.rgba_out;
        while i < n {
            rgba_out[j + 0] = rgb_decoded[i + 0];
            rgba_out[j + 1] = rgb_decoded[i + 1];
            rgba_out[j + 2] = rgb_decoded[i + 2];
            rgba_out[j + 3] = 0xFF;
            i += 3;
            j += 4;
        }
        return true;
    }

    pub fn width(&self) -> u16 {
        self.width
    }

    pub fn height(&self) -> u16 {
        self.height
    }
}
