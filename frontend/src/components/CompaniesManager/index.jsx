import React, { useState, useEffect } from "react";
import {
  Paper,
  Grid,
  FormControl,
  InputLabel,
  MenuItem,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  IconButton,
  Select,
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";

import { Edit as EditIcon } from "@mui/icons-material";

import { toast } from "../ui/ToastProvider";
import useCompanies from "../../hooks/useCompanies";
import usePlans from "../../hooks/usePlans";
import ModalUsers from "../ModalUsers";
import api from "../../services/api";
import { head, isArray, has } from "lodash";
import { useDate } from "../../hooks/useDate";

import moment from "moment";
import { i18n } from "../../translate/i18n";

const useStyles = () => ({
  root: {
    width: "100%",
    padding: "2px"
  },
  mainPaper: {
    width: "100%",
    flex: 1,
    // padding: 16, //comentado para retirar o scroll do Empresas
  },
  fullWidth: {
    width: "100%",
  },
  tableContainer: {
    width: "100%",
    // overflowX: "scroll",
    // 
    padding: "2px",
  },
  textfield: {
    width: "100%",
  },
  textRight: {
    textAlign: "right",
  },
  row: {
    // paddingTop: 16,
    // paddingBottom: 16,
  },
  control: {
    // paddingRight: 8,
    // paddingLeft: 8,
  },
  buttonContainer: {
    textAlign: "right",
    // padding: 8,
  },
});

// Schema de validação Yup
const CompanySchema = Yup.object().shape({
  name: Yup.string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .required("Nome da empresa é obrigatório"),
  email: Yup.string()
    .email("Digite um e-mail válido")
    .required("E-mail é obrigatório"),
  password: Yup.string().when("id", {
    is: (id) => !id, // Se não tem ID (criação)
    then: Yup.string()
      .min(5, "Senha deve ter pelo menos 5 caracteres")
      .required("Senha é obrigatória"),
    otherwise: Yup.string().min(5, "Senha deve ter pelo menos 5 caracteres"),
  }),
  phone: Yup.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .required("Telefone é obrigatório"),
  planId: Yup.string().required("Selecione um plano"),
  document: Yup.string()
    .min(11, "Documento deve ter pelo menos 11 caracteres")
    .max(14, "Documento deve ter no máximo 14 caracteres")
    .required("Documento (CPF/CNPJ) é obrigatório"),
});

export function CompanyForm(props) {
  const { onSubmit, onDelete, onCancel, initialValue, loading } = props;
  const classes = useStyles();
  const [plans, setPlans] = useState([]);
  const [modalUser, setModalUser] = useState(false);
  const [firstUser, setFirstUser] = useState({});
  const [formErrors, setFormErrors] = useState({});

  const [record, setRecord] = useState({
    name: "",
    email: "",
    phone: "",
    planId: "",
    status: true,
    // campaignsEnabled: false,
    dueDate: "",
    recurrence: "",
    password: "",
    document: "",
    ...initialValue,
  });

  const { list: listPlans } = usePlans();

  useEffect(() => {
    async function fetchData() {
      const list = await listPlans();
      setPlans(list);
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setRecord((prev) => {
      if (moment(initialValue).isValid()) {
        initialValue.dueDate = moment(initialValue.dueDate).format(
          "YYYY-MM-DD"
        );
      }
      return {
        ...prev,
        ...initialValue,
      };
    });
  }, [initialValue]);

  const handleSubmit = async (data, { setFieldError, setSubmitting, resetForm }) => {
    try {
      setFormErrors({});
      if (data.dueDate === "" || moment(data.dueDate).isValid() === false) {
        data.dueDate = null;
      }
      await onSubmit(data);
      // Só reseta o formulário se a operação foi bem-sucedida
      resetForm();
      setRecord({ 
        name: "",
        email: "",
        phone: "",
        planId: "",
        status: true,
        dueDate: "",
        recurrence: "",
        password: "",
        document: "",
        ...initialValue 
      });
    } catch (error) {
      // Trata erros específicos e destaca campos com problema
      const errorData = error.response?.data;
      const errorMessage = errorData?.message || error.message;
      
      // Mapeia erros para campos específicos
      const fieldErrors = {};
      
      if (errorMessage.includes("name") || errorMessage.includes("Nome")) {
        fieldErrors.name = "Erro no nome da empresa";
      }
      if (errorMessage.includes("email") || errorMessage.includes("E-mail")) {
        fieldErrors.email = "Erro no e-mail";
      }
      if (errorMessage.includes("password") || errorMessage.includes("senha")) {
        fieldErrors.password = "Erro na senha";
      }
      if (errorMessage.includes("phone") || errorMessage.includes("telefone")) {
        fieldErrors.phone = "Erro no telefone";
      }
      if (errorMessage.includes("planId") || errorMessage.includes("plano")) {
        fieldErrors.planId = "Erro no plano selecionado";
      }
      if (errorMessage.includes("document") || errorMessage.includes("documento")) {
        fieldErrors.document = "Erro no documento";
      }
      
      // Define erros nos campos
      Object.keys(fieldErrors).forEach(field => {
        setFieldError(field, fieldErrors[field]);
      });
      
      setFormErrors(fieldErrors);
      
      // Re-throw o erro para que seja tratado pelo componente pai
      throw error;
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenModalUsers = async () => {
    try {
      const { data } = await api.get("/users/list", {
        params: {
          companyId: initialValue.id,
        },
      });
      if (isArray(data) && data.length) {
        setFirstUser(head(data));
      }
      setModalUser(true);
    } catch (e) {
      toast.error(e);
    }
  };

  const handleCloseModalUsers = () => {
    setFirstUser({});
    setModalUser(false);
  };

  const incrementDueDate = () => {
    const data = { ...record };
    if (data.dueDate !== "" && data.dueDate !== null) {
      switch (data.recurrence) {
        case "MENSAL":
          data.dueDate = moment(data.dueDate)
            .add(1, "month")
            .format("YYYY-MM-DD");
          break;
        case "BIMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(2, "month")
            .format("YYYY-MM-DD");
          break;
        case "TRIMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(3, "month")
            .format("YYYY-MM-DD");
          break;
        case "SEMESTRAL":
          data.dueDate = moment(data.dueDate)
            .add(6, "month")
            .format("YYYY-MM-DD");
          break;
        case "ANUAL":
          data.dueDate = moment(data.dueDate)
            .add(12, "month")
            .format("YYYY-MM-DD");
          break;
        default:
          break;
      }
    }
    setRecord(data);
  };

  return (
    <>
      <ModalUsers
        userId={firstUser.id}
        companyId={initialValue.id}
        open={modalUser}
        onClose={handleCloseModalUsers}
      />
      <Formik
        enableReinitialize
        className={classes.fullWidth}
        initialValues={record}
        validationSchema={CompanySchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, isSubmitting }) => (
          <Form className={classes.fullWidth}>
            <Grid spacing={1} justifyContent="center" container>
              <Grid xs={12} sm={6} md={3} item>
                <Field
                  as={TextField}
                  label={i18n.t("companies.table.name")}
                  name="name"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  error={touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                  required
                />
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={TextField}
                  label={i18n.t("companies.table.email")}
                  name="email"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  error={touched.email && !!errors.email}
                  helperText={touched.email && errors.email}
                  required
                />
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={TextField}
                  label={i18n.t("companies.table.password")}
                  name="password"
                  type="password"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  placeholder="Deixe em branco para manter a senha atual"
                  error={touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                />
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={TextField}
                  label={i18n.t("companies.table.phone")}
                  name="phone"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  error={touched.phone && !!errors.phone}
                  helperText={touched.phone && errors.phone}
                  required
                />
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl 
                  margin="dense" 
                  variant="outlined" 
                  fullWidth
                  error={touched.planId && !!errors.planId}
                >
                  <InputLabel htmlFor="plan-selection">{i18n.t("companies.table.plan")}</InputLabel>
                  <Field
                    as={Select}
                    id="plan-selection"
                    label={i18n.t("companies.table.plan")}
                    labelId="plan-selection-label"
                    name="planId"
                    margin="dense"
                    required
                  >
                    {plans.map((plan, key) => (
                      <MenuItem key={key} value={plan.id}>
                        {plan.name}
                      </MenuItem>
                    ))}
                  </Field>
                  {touched.planId && errors.planId && (
                    <div style={{ color: '#f44336', fontSize: '0.75rem', marginTop: '3px', marginLeft: '14px' }}>
                      {errors.planId}
                    </div>
                  )}
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={1} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="status-selection">{i18n.t("companies.table.active")}</InputLabel>
                  <Field
                    as={Select}
                    id="status-selection"
                    label={i18n.t("companies.table.active")}
                    labelId="status-selection-label"
                    name="status"
                    margin="dense"
                  >
                    <MenuItem value={true}>{i18n.t("companies.table.yes")}</MenuItem>
                    <MenuItem value={false}>{i18n.t("companies.table.no")}</MenuItem>
                  </Field>
                </FormControl>
              </Grid>
              {/* <Grid xs={12} sm={6} md={3} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="payment-method-selection">
                    Método de Pagamento
                  </InputLabel>
                  <Field
                    as={Select}
                    id="payment-method-selection"
                    label="Método de Pagamento"
                    labelId="payment-method-selection-label"
                    name="paymentMethod"
                    margin="dense"
                  >
                    <MenuItem value={"pix"}>PIX</MenuItem>
                  </Field>
                </FormControl>
              </Grid> */}
              <Grid xs={12} sm={6} md={2} item>
                <Field
                  as={TextField}
                  label={i18n.t("companies.table.document")}
                  name="document"
                  variant="outlined"
                  className={classes.fullWidth}
                  margin="dense"
                  error={touched.document && !!errors.document}
                  helperText={touched.document && errors.document}
                  required
                />
              </Grid>
              {/* <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="status-selection">Campanhas</InputLabel>
                  <Field
                    as={Select}
                    id="campaigns-selection"
                    label="Campanhas"
                    labelId="campaigns-selection-label"
                    name="campaignsEnabled"
                    margin="dense"
                  >
                    <MenuItem value={true}>Habilitadas</MenuItem>
                    <MenuItem value={false}>Desabilitadas</MenuItem>
                  </Field>
                </FormControl>
              </Grid> */}
              <Grid xs={12} sm={6} md={2} item>
                <FormControl variant="outlined" fullWidth>
                  <Field
                    as={TextField}
                    label={i18n.t("companies.table.dueDate")}
                    type="date"
                    name="dueDate"
                    InputLabelProps={{
                      shrink: true,
                    }}
                    variant="outlined"
                    fullWidth
                    margin="dense"
                  />
                </FormControl>
              </Grid>
              <Grid xs={12} sm={6} md={2} item>
                <FormControl margin="dense" variant="outlined" fullWidth>
                  <InputLabel htmlFor="recorrencia-selection">
                  {i18n.t("companies.table.recurrence")}
                  </InputLabel>
                  <Field
                    as={Select}
                    label="Recorrência"
                    labelId="recorrencia-selection-label"
                    id="recurrence"
                    name="recurrence"
                    margin="dense"
                  >
                    <MenuItem value="MENSAL">{i18n.t("companies.table.monthly")}</MenuItem>
                    <MenuItem value="BIMESTRAL">{i18n.t("companies.table.bimonthly")}</MenuItem>
                    <MenuItem value="TRIMESTRAL">{i18n.t("companies.table.quarterly")}</MenuItem>
                    <MenuItem value="SEMESTRAL">{i18n.t("companies.table.semester")}</MenuItem>
                    <MenuItem value="ANUAL">{i18n.t("companies.table.yearly")}</MenuItem>
                  </Field>
                </FormControl>
              </Grid>
              <Grid xs={12} item>
                <Grid justifyContent="flex-end" spacing={1} container>
                  <Grid xs={4} md={1} item>
                    <ButtonWithSpinner
                      className={classes.fullWidth}
                      style={{ marginTop: 7 }}
                      loading={loading}
                      onClick={() => onCancel()}
                      variant="contained"
                    >
                      {i18n.t("companies.table.clear")}
                    </ButtonWithSpinner>
                  </Grid>
                  {record.id !== undefined ? (
                    <>
                      <Grid xs={6} md={1} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => onDelete(record)}
                          variant="contained"
                          color="secondary"
                        >
                          {i18n.t("companies.table.delete")}
                        </ButtonWithSpinner>
                      </Grid>
                      <Grid xs={6} md={2} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => incrementDueDate()}
                          variant="contained"
                          color="primary"
                        >
                          {i18n.t("companies.table.dueDate")}
                        </ButtonWithSpinner>
                      </Grid>
                      {/* <Grid xs={6} md={1} item>
                        <ButtonWithSpinner
                          style={{ marginTop: 7 }}
                          className={classes.fullWidth}
                          loading={loading}
                          onClick={() => handleOpenModalUsers()}
                          variant="contained"
                          color="primary"
                        >
                          {i18n.t("companies.table.user")}
                        </ButtonWithSpinner>
                      </Grid> */}
                    </>
                  ) : null}
                  <Grid xs={6} md={1} item>
                    <ButtonWithSpinner
                      className={classes.fullWidth}
                      style={{ marginTop: 7 }}
                      loading={loading || isSubmitting}
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isSubmitting}
                    >
                      {i18n.t("companies.table.save")}
                    </ButtonWithSpinner>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
    </>
  );
}

export function CompaniesManagerGrid(props) {
  const { records, onSelect } = props;
  const classes = useStyles();
  const { dateToClient, datetimeToClient } = useDate();

  const renderStatus = (row) => {
    return row.status === false ? "Não" : "Sim";
  };

  const renderPlan = (row) => {
    return row.planId !== null ? row.plan.name : "-";
  };

  const renderPlanValue = (row) => {
    return row.planId !== null ? row.plan.amount ? row.plan.amount.toLocaleString('pt-br', { minimumFractionDigits: 2 }) : '00.00' : "-";
  };

  // const renderCampaignsStatus = (row) => {
  //   if (
  //     has(row, "settings") &&
  //     isArray(row.settings) &&
  //     row.settings.length > 0
  //   ) {
  //     const setting = row.settings.find((s) => s.key === "campaignsEnabled");
  //     if (setting) {
  //       return setting.value === "true" ? "Habilitadas" : "Desabilitadas";
  //     }
  //   }
  //   return "Desabilitadas";
  // };

  const rowStyle = (record) => {
    if (moment(record.dueDate).isValid()) {
      const now = moment();
      const dueDate = moment(record.dueDate);
      const diff = dueDate.diff(now, "days");
      if (diff >= 1 && diff <= 5) {
        return { backgroundColor: "#fffead" };
      }
      if (diff <= 0) {
        return { backgroundColor: "#fa8c8c" };
      }
      // else {
      //   return { backgroundColor: "#affa8c" };
      // }
    }
    return {};
  };

  return (
    <Paper className={classes.tableContainer}>
      <Table
        className={classes.fullWidth}
        // size="small"
        padding="none"
        aria-label="a dense table"
      >
        <TableHead>
          <TableRow>
            <TableCell align="center" style={{ width: "1%" }}>#</TableCell>
            <TableCell align="left">{i18n.t("companies.table.name")}</TableCell>
            <TableCell align="left">{i18n.t("companies.table.email")}</TableCell>
            <TableCell align="center">{i18n.t("companies.table.phone")}</TableCell>
            <TableCell align="center">{i18n.t("companies.table.plan")}</TableCell>
            <TableCell align="center">{i18n.t("companies.table.value")}</TableCell>
            {/* <TableCell align="center">Campanhas</TableCell> */}
            <TableCell align="center">{i18n.t("companies.table.active")}</TableCell>
            <TableCell align="center">{i18n.t("companies.table.createdAt")}</TableCell>
            <TableCell align="center">{i18n.t("companies.table.dueDate")}</TableCell>
            <TableCell align="center">{i18n.t("companies.table.lastLogin")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {records.map((row, key) => (
            <TableRow style={rowStyle(row)} key={key}>
              <TableCell align="center" style={{ width: "1%" }}>
                <IconButton onClick={() => onSelect(row)} aria-label="delete">
                  <EditIcon />
                </IconButton>
              </TableCell>
              <TableCell align="left">{row.name || "-"}</TableCell>
              <TableCell align="left" size="small">{row.email || "-"}</TableCell>
              <TableCell align="center">{row.phone || "-"}</TableCell>
              <TableCell align="center">{renderPlan(row)}</TableCell>
              <TableCell align="center">{i18n.t("companies.table.money")} {renderPlanValue(row)}</TableCell>
              {/* <TableCell align="center">{renderCampaignsStatus(row)}</TableCell> */}
              <TableCell align="center">{renderStatus(row)}</TableCell>
              <TableCell align="center">{dateToClient(row.createdAt)}</TableCell>
              <TableCell align="center">{dateToClient(row.dueDate)}<br /><span>{row.recurrence}</span></TableCell>
              <TableCell align="center">{datetimeToClient(row.lastLogin)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function CompaniesManager() {
  const classes = useStyles();
  const { list, save, update, remove } = useCompanies();

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [record, setRecord] = useState({
    name: "",
    email: "",
    phone: "",
    planId: "",
    status: true,
    // campaignsEnabled: false,
    dueDate: "",
    recurrence: "",
    password: "",
    document: "",
    paymentMethod: ""
  });

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const companyList = await list();
      setRecords(companyList);
    } catch (e) {
      toast.error("Não foi possível carregar a lista de registros");
    }
    setLoading(false);
  };

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      if (data.id !== undefined) {
        await update(data);
      } else {
        await save(data);
      }
      await loadPlans();
      handleCancel();
      toast.success("Operação realizada com sucesso!");
    } catch (e) {
      console.error("Erro ao salvar empresa:", e);
      
      // Tratamento específico de erros
      let errorMessage = "Não foi possível realizar a operação.";
      let fieldErrors = {};
      
      // Verifica se há erro na resposta do backend (campo 'error' ou 'message')
      const backendMessage = e.response?.data?.error || e.response?.data?.message;
      
      if (backendMessage) {
        // Mapeamento de erros específicos com destaque nos campos
        if (backendMessage.includes("companyUserName is a required field")) {
          errorMessage = "O campo 'Nome do Administrador' é obrigatório.";
          fieldErrors.name = "Nome do administrador é obrigatório";
        } else if (backendMessage.includes("name must be unique") || backendMessage.includes("Já existe uma empresa com este nome")) {
          errorMessage = "Já existe uma empresa com este nome. Escolha outro nome.";
          fieldErrors.name = "Já existe uma empresa com este nome";
        } else if (backendMessage.includes("email must be unique") || backendMessage.includes("Já existe uma empresa com este email")) {
          errorMessage = "Já existe uma empresa com este e-mail. Use outro e-mail.";
          fieldErrors.email = "Já existe uma empresa com este e-mail";
        } else if (backendMessage.includes("document must be unique") || backendMessage.includes("Já existe uma empresa com este documento")) {
          errorMessage = "Já existe uma empresa com este documento. Verifique o CNPJ/CPF.";
          fieldErrors.document = "Já existe uma empresa com este documento";
        } else if (backendMessage.includes("name is a required field") || backendMessage.includes("Nome da empresa é obrigatório")) {
          errorMessage = "O campo 'Nome da Empresa' é obrigatório.";
          fieldErrors.name = "Nome da empresa é obrigatório";
        } else if (backendMessage.includes("email is a required field") || backendMessage.includes("Email é obrigatório")) {
          errorMessage = "O campo 'E-mail' é obrigatório.";
          fieldErrors.email = "E-mail é obrigatório";
        } else if (backendMessage.includes("password is a required field") || backendMessage.includes("Senha é obrigatória")) {
          errorMessage = "O campo 'Senha' é obrigatório.";
          fieldErrors.password = "Senha é obrigatória";
        } else if (backendMessage.includes("password must be at least 5 characters") || backendMessage.includes("Senha deve ter pelo menos 5 caracteres")) {
          errorMessage = "A senha deve ter pelo menos 5 caracteres.";
          fieldErrors.password = "Senha deve ter pelo menos 5 caracteres";
        } else if (backendMessage.includes("planId is a required field") || backendMessage.includes("Plano é obrigatório")) {
          errorMessage = "Selecione um plano para a empresa.";
          fieldErrors.planId = "Selecione um plano";
        } else if (backendMessage.includes("document is a required field") || backendMessage.includes("Documento é obrigatório")) {
          errorMessage = "O campo 'Documento (CNPJ/CPF)' é obrigatório.";
          fieldErrors.document = "Documento é obrigatório";
        } else if (backendMessage.includes("phone is a required field") || backendMessage.includes("Telefone é obrigatório")) {
          errorMessage = "O campo 'Telefone' é obrigatório.";
          fieldErrors.phone = "Telefone é obrigatório";
        } else if (backendMessage.includes("email must be a valid email") || backendMessage.includes("Email deve ter um formato válido")) {
          errorMessage = "Digite um e-mail válido.";
          fieldErrors.email = "Digite um e-mail válido";
        } else if (backendMessage.includes("document must be between 11 and 14 characters") || backendMessage.includes("Documento deve ter pelo menos 11 caracteres")) {
          errorMessage = "O documento deve ter entre 11 e 14 caracteres (CPF ou CNPJ).";
          fieldErrors.document = "Documento deve ter entre 11 e 14 caracteres";
        } else {
          // Se não conseguir mapear, usa a mensagem do backend
          errorMessage = backendMessage;
        }
      } else if (e.message) {
        errorMessage = `Erro de conexão: ${e.message}`;
      }
      
      // Os erros nos campos específicos são tratados no CompanyForm
      
      toast.error(errorMessage);
      
      // Re-throw o erro para que seja tratado pelo formulário
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await remove(record.id);
      await loadPlans();
      handleCancel();
      toast.success("Operação realizada com sucesso!");
    } catch (e) {
      toast.error("Não foi possível realizar a operação");
    }
    setLoading(false);
  };

  const handleOpenDeleteDialog = () => {
    setShowConfirmDialog(true);
  };

  const handleCancel = () => {
    setRecord((prev) => ({
      ...prev,
      name: "",
      email: "",
      phone: "",
      planId: "",
      status: true,
      // campaignsEnabled: false,
      dueDate: "",
      recurrence: "",
      password: "",
      document: "",
      paymentMethod: ""
    }));
  };

  const handleSelect = (data) => {
    // let campaignsEnabled = false;

    // const setting = data.settings.find(
    //   (s) => s.key.indexOf("campaignsEnabled") > -1
    // );
    // if (setting) {
    //   campaignsEnabled = setting.value === "true" || setting.value === "enabled";
    // }

    setRecord((prev) => ({
      ...prev,
      id: data.id,
      name: data.name || "",
      phone: data.phone || "",
      email: data.email || "",
      planId: data.planId || "",
      status: data.status === false ? false : true,
      // campaignsEnabled,
      dueDate: data.dueDate || "",
      recurrence: data.recurrence || "",
      password: "",
      document: data.document || "",
      paymentMethod: data.paymentMethod || "",
    }));
  };

  return (
    <Paper className={classes.mainPaper} elevation={0}>
      <Grid spacing={2} container>
        <Grid xs={12} item>
          <CompanyForm
            initialValue={record}
            onDelete={handleOpenDeleteDialog}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </Grid>
        <Grid xs={12} item>
          <CompaniesManagerGrid records={records} onSelect={handleSelect} />
        </Grid>
      </Grid>
      <ConfirmationModal
        title="Exclusão de Registro"
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => handleDelete()}
      >
        Deseja realmente excluir esse registro?
      </ConfirmationModal>
    </Paper>
  );
}
