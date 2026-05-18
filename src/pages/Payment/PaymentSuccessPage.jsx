import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import "./PaymentSuccessPage.css";

const PaymentSuccessPage = () => {
  return (
    <div className="payment-success-wrapper">
      <Container maxWidth="md">
        <Box className="payment-success-card">
          <CheckCircleIcon className="payment-success-icon" />

          <Typography
            variant="h3"
            component="h1"
            className="payment-success-title"
          >
            Payment Success!
          </Typography>

          <Typography
            variant="h5"
            component="h2"
            className="payment-success-subtitle"
          >
            Your payment was completed successfully
          </Typography>

          <Typography variant="body1" className="payment-success-description">
            Thank you for your payment. A confirmation email has been sent to
            your registered email address.
          </Typography>

          <Box className="payment-success-btn-wrapper">
            <Button
              variant="contained"
              size="large"
              href="#"
              className="payment-success-btn"
            >
              Go to Dashboard
            </Button>

            <Button
              variant="outlined"
              size="large"
              href="#"
              className="payment-success-btn-outline"
            >
              View Invoice
            </Button>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default PaymentSuccessPage;
