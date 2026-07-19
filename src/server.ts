import app from './app';

const PORT = process.env.PORT || 3007;

app.listen(PORT, () => {
  console.log(`GrantMatch AI Backend is running on http://localhost:${PORT}`);
});

// Trigger backend reload
