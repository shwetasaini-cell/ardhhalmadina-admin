import React from "react";
import { Box, Typography, Button, Container } from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";

import "./PaymentFailedPage.css";

const PaymentFailedPage = () => {
  return (
    <div className="payment-failed-wrapper">
      <Container maxWidth="md">
        <Box className="payment-failed-card">
          <ErrorIcon className="payment-failed-icon" />

          <Typography
            variant="h3"
            component="h1"
            className="payment-failed-title"
          >
            Payment Failed
          </Typography>

          <Typography
            variant="h5"
            component="h2"
            className="payment-failed-subtitle"
          >
            We couldn't process your payment
          </Typography>

          <Typography variant="body1" className="payment-failed-description">
            Your payment was not successful. Please check your payment details
            and try again.
          </Typography>

          <Box className="payment-failed-btn-wrapper">
            <Button
              variant="contained"
              color="error"
              size="large"
              href="#"
              className="payment-failed-btn"
            >
              Try Again
            </Button>
          </Box>
        </Box>
      </Container>
    </div>
  );
};

export default PaymentFailedPage;
