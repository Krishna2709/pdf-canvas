import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { generateMockExtraction } from './utils/mockExtraction';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded PDFs
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Upload PDF and get extraction
app.post('/api/upload', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  const documentId = uuidv4();
  const filename = req.file.filename;

  // Generate mock extraction data
  const extraction = generateMockExtraction(documentId, filename);

  res.json({
    documentId,
    filename,
    url: `/uploads/${filename}`,
    extraction,
  });
});

// Get extraction for a document (mock endpoint)
app.get('/api/extraction/:documentId', (req, res) => {
  const { documentId } = req.params;

  // In a real app, this would fetch from a database
  // For now, return mock data
  const extraction = generateMockExtraction(documentId, 'document.pdf');

  res.json(extraction);
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
