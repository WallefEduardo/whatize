import React, { useEffect, useContext } from 'react';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { AuthContext } from "../../../context/Auth/AuthContext";

// Converted makeStyles to inline styles for Material-UI v5 compatibility
const styles = {
  cardHeader: {
    backgroundColor: "var(--color-primary)",
  },
  cardPricing: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  margin: {
    margin: 8,
  },
  footer: {
    borderTop: "1px solid var(--color-primary)",
    marginTop: 8,
    paddingTop: 24,
    paddingBottom: 24,
  },
};

export default function PaymentForm(props) {
  const {
    setFieldValue,
    setActiveStep,
    activeStep,
    invoiceId
  } = props;

  // Using inline styles instead of classes
  const { user } = useContext(AuthContext);
  const invoice = props.Invoice || {};

  useEffect(() => {
    // Quando o componente é montado, definimos o valor do plano
    // com os dados da fatura atual
    setFieldValue("plan", JSON.stringify({
      title: invoice.detail || "Plano",
      price: invoice.value || 0,
      users: invoice.users || 0,
      connections: invoice.connections || 0,
      queues: invoice.queues || 0
    }));
    
    // Apenas para depuração
    // console.log("Invoice data:", invoice);
  }, [setFieldValue, invoice]);

  return (
    <React.Fragment>
      <Grid container spacing={3}>
        <Grid item xs={12} md={12}>
          <Card>
            <CardHeader
              title={invoice.detail || "Fatura"}
              titleTypographyProps={{ align: 'center' }}
              sx={styles.cardHeader}
            />
            <CardContent>
              <div style={styles.cardPricing}>
                <Typography component="h2" variant="h3" color="textPrimary">
                  R${invoice.value ? invoice.value.toLocaleString('pt-br', { minimumFractionDigits: 2 }) : "0,00"}
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  /mês
                </Typography>
              </div>
              <ul>
                <Typography component="li" variant="subtitle1" align="center">
                  {invoice.users || 0} Usuários
                </Typography>
                <Typography component="li" variant="subtitle1" align="center">
                  {invoice.connections || 0} Conexões
                </Typography>
                <Typography component="li" variant="subtitle1" align="center">
                  {invoice.queues || 0} Filas
                </Typography>
              </ul>
            </CardContent>
            <CardActions>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => {
                  setActiveStep(activeStep + 1);
                }}
              >
                CONTINUAR
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>
  );
}