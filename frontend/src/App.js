import React, { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { 
  AppBar, Toolbar, Typography, Container, Tabs, Tab, Box,
  ThemeProvider, createTheme, CssBaseline
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';

import CompleteCalculator from './components/CompleteCalculator';
import CSVProcessor from './components/CSVProcessor';
import ConfigEditor from './components/ConfigEditor';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <CalculateIcon sx={{ mr: 2 }} />
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Motor Premium Calculator - All 86 Excel Fields (A-CH)
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 3 }}>
              <Tab icon={<CalculateIcon />} label="Complete Calculator (86 Fields)" />
              <Tab icon={<UploadFileIcon />} label="CSV Bulk Processing" />
              <Tab icon={<SettingsIcon />} label="Configuration Editor" />
            </Tabs>

            <Box sx={{ mt: 3 }}>
              {tabValue === 0 && <CompleteCalculator />}
              {tabValue === 1 && <CSVProcessor />}
              {tabValue === 2 && <ConfigEditor />}
            </Box>
          </Container>

          <Box sx={{ bgcolor: 'background.paper', p: 3, mt: 8 }} component="footer">
            <Typography variant="body2" color="text.secondary" align="center">
              Motor Insurance Premium Calculator v2.0.0 - Complete Excel Implementation
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              All 86 Fields: 26 Inputs (A-Z) + 30 Calculations (AA-BD) + 30 Display (BE-CH)
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Powered by JSON-based configuration • No database required
            </Typography>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
