import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const audioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'memory/audio_messages/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, uuidv4() + '.webm');
  },
});

export const upload = multer({ storage: audioStorage });
