import app from './app';

const PORT = process.env.PORT || 4002;

app.listen(PORT, () => {
  console.log(`GrantMatch AI Backend is running on http://localhost:${PORT}`);
});

// Trigger backend reload
