import React, { useState } from 'react';
import {
  Paper, Typography, Button, Box, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Card, CardContent, Grid
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DownloadIcon from '@mui/icons-material/Download';
import calculatorAPI from '../services/api';
import { saveAs } from 'file-saver';

const CSVProcessor = () => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setProcessing(true);
    setError(null);
    setResults(null);

    try {
      const response = await calculatorAPI.processCSV(file);
      setResults(response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownload = async () => {
    if (!file) return;

    setProcessing(true);
    try {
      const blob = await calculatorAPI.downloadCSV(file);
      saveAs(blob, 'premium_results.csv');
    } catch (err) {
      setError('Download failed');
    } finally {
      setProcessing(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleData = `cc_category,zone,purchase_date,renewal_date,idv,ncb_percent,od_discount_percent,nil_dep,engine_protection,consumables,cpa_owner_driver
1000cc_1500cc,A,2024-01-01,2025-01-01,125000,20,60,1,1,1,1
upto_1000cc,B,2020-06-15,2021-06-15,75000,50,40,0,0,0,1
above_1500cc,A,2023-03-20,2024-03-20,200000,30,50,1,1,1,1`;
    
    const blob = new Blob([sampleData], { type: 'text/csv' });
    saveAs(blob, 'sample_input.csv');
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>CSV Bulk Processing</Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Upload a CSV file with multiple premium calculations. The system will process all rows and provide results.
      </Typography>

      <Box sx={{ my: 3 }}>
        <Button variant="outlined" onClick={downloadSampleCSV} sx={{ mr: 2 }}>
          Download Sample CSV
        </Button>
      </Box>

      <Box sx={{ my: 3 }}>
        <input
          accept=".csv"
          style={{ display: 'none' }}
          id="csv-file-input"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="csv-file-input">
          <Button variant="contained" component="span" startIcon={<UploadFileIcon />}>
            Choose CSV File
          </Button>
        </label>
        {file && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Selected: {file.name}
          </Typography>
        )}
      </Box>

      <Box sx={{ my: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleProcess}
          disabled={!file || processing}
          sx={{ mr: 2 }}
        >
          {processing ? 'Processing...' : 'Process CSV'}
        </Button>
        
        <Button
          variant="contained"
          color="success"
          onClick={handleDownload}
          disabled={!file || processing}
          startIcon={<DownloadIcon />}
        >
          Download Results
        </Button>
      </Box>

      {processing && <LinearProgress sx={{ my: 2 }} />}

      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}

      {results && (
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Total Rows</Typography>
                  <Typography variant="h4">{results.total_rows}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'success.light' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Successful</Typography>
                  <Typography variant="h4">{results.successful}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'error.light' }}>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom>Failed</Typography>
                  <Typography variant="h4">{results.failed}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {results.results && results.results.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Sample Results (First 10)</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>IDV</TableCell>
                      <TableCell>Age</TableCell>
                      <TableCell>Net Premium</TableCell>
                      <TableCell>Total Premium</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.results.slice(0, 10).map((result) => (
                      <TableRow key={result.row_number}>
                        <TableCell>{result.row_number}</TableCell>
                        <TableCell>₹{result.inputs.idv.toLocaleString()}</TableCell>
                        <TableCell>{result.calculations.age_years} years</TableCell>
                        <TableCell>₹{result.calculations.net_premium.toLocaleString()}</TableCell>
                        <TableCell>₹{result.calculations.total_premium.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {results.errors && results.errors.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom color="error">Errors</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Errors</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.errors.slice(0, 10).map((error, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{error.row}</TableCell>
                        <TableCell>{error.errors.join(', ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default CSVProcessor;
