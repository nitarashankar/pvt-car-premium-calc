import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Container, Tabs, Tab, Box,
  ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import CompleteCalculator from './components/CompleteCalculator';
import GCVCalculator from './components/GCVCalculator';
import CSVProcessor from './components/CSVProcessor';
import ConfigEditor from './components/ConfigEditor';

const theme = createTheme({
  palette: {
    primary: { main: '#0066CC', light: '#3388DD', dark: '#004C99' },
    secondary: { main: '#5856D6' },
    background: { default: '#f5f5f7', paper: '#ffffff' },
    text: { primary: '#1d1d1f', secondary: '#6e6e73' },
  },
  typography: {
    fontFamily: [
      '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', '"SF Pro Text"',
      '"Inter"', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
    ].join(','),
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 600, letterSpacing: '-0.01em' },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s cubic-bezier(0.25,0.1,0.25,1)',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: 'none', fontWeight: 600, padding: '10px 24px' },
        containedPrimary: {
          background: 'linear-gradient(135deg, #0066CC 0%, #004C99 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #3388DD 0%, #0066CC 100%)' },
        },
      },
    },
    MuiTextField: {
      styleOverrides: { root: { '& .MuiOutlinedInput-root': { borderRadius: 12 } } },
    },
    MuiSelect: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiOutlinedInput: {
      styleOverrides: { root: { borderRadius: 12 } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: 'none', fontWeight: 500, minHeight: 48 } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.72)',
          backdropFilter: 'saturate(180%) blur(20px)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
          color: '#1d1d1f',
        },
      },
    },
  },
});

function PvtCarPage() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Box sx={{
        bgcolor: 'background.paper', borderRadius: 3, mb: 3,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          centered
          TabIndicatorProps={{ sx: { height: 3, borderRadius: 2 } }}
        >
          <Tab icon={<CalculateIcon />} iconPosition="start" label="Calculator" />
          <Tab icon={<UploadFileIcon />} iconPosition="start" label="CSV Processor" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Config" />
        </Tabs>
      </Box>
      <Box>
        {tabValue === 0 && <CompleteCalculator />}
        {tabValue === 1 && <CSVProcessor />}
        {tabValue === 2 && <ConfigEditor />}
      </Box>
    </>
  );
}

function GCVPage() {
  return <GCVCalculator />;
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const isGCV = location.pathname.startsWith('/gcv');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ maxWidth: 1200, width: '100%', mx: 'auto', px: { xs: 2, md: 3 } }}>
          <CalculateIcon sx={{ mr: 1.5, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: 'text.primary' }}>
            Motor Premium Calculator
          </Typography>
          <Tabs
            value={isGCV ? 1 : 0}
            onChange={(e, newVal) => navigate(newVal === 1 ? '/gcv' : '/')}
            textColor="primary"
            indicatorColor="primary"
            TabIndicatorProps={{ sx: { height: 3, borderRadius: 2 } }}
          >
            <Tab icon={<CalculateIcon />} iconPosition="start" label="Private Car" sx={{ textTransform: 'none', fontWeight: 500 }} />
            <Tab icon={<LocalShippingIcon />} iconPosition="start" label="GCV" sx={{ textTransform: 'none', fontWeight: 500 }} />
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ pt: 3, pb: 6 }}>
        <Routes>
          <Route path="/gcv" element={<GCVPage />} />
          <Route path="/*" element={<PvtCarPage />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
