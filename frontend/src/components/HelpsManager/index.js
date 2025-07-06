import React, { useState, useEffect } from "react";
import {
    makeStyles,
    Paper,
    Grid,
    TextField,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableRow,
    IconButton,
    InputAdornment,
    Tooltip,
    FormControl,
    InputLabel,
    Select,
    MenuItem
} from "@material-ui/core";
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import ButtonWithSpinner from "../ButtonWithSpinner";
import ConfirmationModal from "../ConfirmationModal";
import CategoryModal from "../CategoryModal";

import { Edit as EditIcon, Add as AddIcon, Delete as DeleteIcon } from "@material-ui/icons";

import { toast } from "react-toastify";
import useHelps from "../../hooks/useHelps";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles(theme => ({
	root: {
		width: '100%'
	},
    mainPaper: {
		width: '100%',
		flex: 1,
		padding: theme.spacing(2)
    },
	fullWidth: {
		width: '100%'
	},
    tableContainer: {
		width: '100%',
		overflowX: "scroll",
		...theme.scrollbarStyles
    },
	textfield: {
		width: '100%'
	},
    textRight: {
        textAlign: 'right'
    },
    row: {
		paddingTop: theme.spacing(2),
		paddingBottom: theme.spacing(2)
    },
    control: {
		paddingRight: theme.spacing(1),
		paddingLeft: theme.spacing(1)
	},
    buttonContainer: {
        textAlign: 'right',
		padding: theme.spacing(1)
	}
}));

// Schema de validação
const validationSchema = Yup.object().shape({
    title: Yup.string()
        .required('O título é obrigatório')
        .min(3, 'O título deve ter pelo menos 3 caracteres'),
    video: Yup.string()
        .required('O código do vídeo é obrigatório'),
    category: Yup.string()
        .required('A categoria é obrigatória'),
    description: Yup.string()
        .notRequired() // Explicitamente não obrigatório
});

export function HelpManagerForm (props) {
    const { onSubmit, onDelete, onCancel, initialValue, loading } = props;
    const classes = useStyles()
    const { createCategory, listCategories, updateCategory, deleteCategory } = useHelps();

    const [record, setRecord] = useState(initialValue);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        setRecord(initialValue)
    }, [initialValue])

    useEffect(() => {
        loadCategories();
    }, [])

    const loadCategories = async () => {
        try {
            const categoriesData = await listCategories();
            setCategories(categoriesData);
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
        }
    }

    const handleSubmit = async(data) => {
        onSubmit(data)
    }

    const handleCreateCategory = async (categoryData) => {
        try {
            await createCategory(categoryData);
            toast.success("Categoria criada com sucesso!");
            setCategoryModalOpen(false);
            setEditingCategory(null);
            // Recarregar categorias
            loadCategories();
        } catch (error) {
            console.error("Erro ao criar categoria:", error);
            toast.error("Erro ao criar categoria");
        }
    }

    const handleUpdateCategory = async (categoryId, categoryData) => {
        try {
            await updateCategory(categoryId, categoryData);
            toast.success("Categoria atualizada com sucesso!");
            setCategoryModalOpen(false);
            setEditingCategory(null);
            // Recarregar categorias
            loadCategories();
        } catch (error) {
            console.error("Erro ao atualizar categoria:", error);
            toast.error("Erro ao atualizar categoria");
        }
    }

    const handleEditCategory = (category) => {
        try {
            setEditingCategory(category);
            setCategoryModalOpen(true);
        } catch (error) {
            console.error('Erro ao editar categoria:', error);
            toast.error('Erro ao editar categoria');
        }
    };

    const handleDeleteCategory = async (categoryId) => {
        try {
            await deleteCategory(categoryId);
            await loadCategories(); // Recarregar lista de categorias
            toast.success('Categoria excluída com sucesso!');
        } catch (error) {
            console.error('Erro ao excluir categoria:', error);
            toast.error('Erro ao excluir categoria');
        }
    };

    const handleCloseCategoryModal = () => {
        setCategoryModalOpen(false);
        setEditingCategory(null);
    };

    // Função para extrair código do YouTube de URLs
    const extractYouTubeCode = (input) => {
        if (!input) return '';
        
        // Se já é um código (11 caracteres, sem espaços)
        if (input.length === 11 && !/\s/.test(input) && !/[\/\?=]/.test(input)) {
            return input;
        }
        
        // Padrões de URL do YouTube
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
            /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) {
                return match[1];
            }
        }
        
        return input; // Retorna o input original se não conseguir extrair
    }

    return (
        <>
            <Formik
                enableReinitialize
                className={classes.fullWidth}
                initialValues={record}
                onSubmit={(values, { resetForm }) =>
                    setTimeout(() => {
                        handleSubmit(values)
                        resetForm()
                    }, 500)
                }
                validationSchema={validationSchema}
            >
                {({ values, errors, touched }) => (
                    <Form className={classes.fullWidth}>
                        <Grid spacing={2} container>
                            {/* Primeira linha - Título, Código do Vídeo e Categoria */}
                            <Grid xs={12} sm={4} item>
                                <Field
                                    as={TextField}
                                    label="Título *"
                                    name="title"
                                    variant="outlined"
                                    className={classes.fullWidth}
                                    margin="dense"
                                    placeholder="Ex: Como configurar WhatsApp"
                                    error={touched.title && Boolean(errors.title)}
                                    helperText={touched.title && errors.title}
                                />
                            </Grid>
                            <Grid xs={12} sm={4} item>
                                <Field name="video">
                                    {({ field, form, meta }) => (
                                        <TextField
                                            {...field}
                                            label={`${i18n.t("helps.settings.codeVideo")} *`}
                                            variant="outlined"
                                            className={classes.fullWidth}
                                            margin="dense"
                                            placeholder="Cole o link ou código do YouTube"
                                            error={meta.touched && Boolean(meta.error)}
                                            helperText={meta.touched && meta.error}
                                            onBlur={(e) => {
                                                const extractedCode = extractYouTubeCode(e.target.value);
                                                form.setFieldValue(field.name, extractedCode);
                                                field.onBlur(e);
                                            }}
                                        />
                                    )}
                                </Field>
                            </Grid>
                            <Grid xs={12} sm={4} item>
                                <Grid container spacing={1} alignItems="flex-end">
                                    <Grid item style={{ flex: 1 }}>
                                        <FormControl 
                                            variant="outlined" 
                                            fullWidth 
                                            margin="dense"
                                            error={touched.category && Boolean(errors.category)}
                                        >
                                            <InputLabel>Categoria *</InputLabel>
                                            <Field name="category">
                                                {({ field, form, meta }) => (
                                                    <Select
                                                        {...field}
                                                        label="Categoria *"
                                                        value={field.value || ''}
                                                        onChange={(e) => form.setFieldValue(field.name, e.target.value)}
                                                        MenuProps={{
                                                            anchorOrigin: {
                                                                vertical: 'bottom',
                                                                horizontal: 'left'
                                                            },
                                                            transformOrigin: {
                                                                vertical: 'top',
                                                                horizontal: 'left'
                                                            },
                                                            getContentAnchorEl: null
                                                        }}
                                                    >
                                                        <MenuItem value="">
                                                            <em>Selecione uma categoria</em>
                                                        </MenuItem>
                                                        {categories.map((category) => (
                                                            <MenuItem key={category.id} value={category.name}>
                                                                {category.name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                )}
                                            </Field>
                                            {touched.category && errors.category && (
                                                <div style={{ 
                                                    color: '#f44336', 
                                                    fontSize: '0.75rem', 
                                                    marginTop: '3px',
                                                    marginLeft: '14px'
                                                }}>
                                                    {errors.category}
                                                </div>
                                            )}
                                        </FormControl>
                                    </Grid>
                                    <Grid item>
                                        <Tooltip title="Criar nova categoria">
                                            <IconButton 
                                                onClick={() => setCategoryModalOpen(true)}
                                                size="small"
                                                style={{ marginBottom: 8 }}
                                            >
                                                <AddIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Grid>
                                </Grid>
                            </Grid>
                            
                            {/* Segunda linha - Descrição (campo opcional) */}
                            <Grid xs={12} item>
                                <Field
                                    as={TextField}
                                    label={i18n.t("helps.settings.description")}
                                    name="description"
                                    variant="outlined"
                                    className={classes.fullWidth}
                                    margin="dense"
                                    multiline
                                    rows={3}
                                    rowsMax={6}
                                    placeholder="Descreva o conteúdo do vídeo e quando utilizá-lo... (opcional)"
                                    InputProps={{
                                        style: {
                                            wordWrap: 'break-word',
                                            overflowWrap: 'break-word',
                                            wordBreak: 'break-word'
                                        }
                                    }}
                                />
                            </Grid>
                            {/* Terceira linha - Botões de ação */}
                            <Grid xs={12} item>
                                <Grid container spacing={2} justifyContent="flex-end">
                                    <Grid item>
                                        <ButtonWithSpinner 
                                            loading={loading} 
                                            onClick={() => onCancel()} 
                                            variant="outlined"
                                        >
                                            {i18n.t("helps.settings.clear")}
                                        </ButtonWithSpinner>
                                    </Grid>
                                    { record.id !== undefined ? (
                                        <Grid item>
                                            <ButtonWithSpinner 
                                                loading={loading} 
                                                onClick={() => onDelete(record)} 
                                                variant="contained" 
                                                color="secondary"
                                            >
                                                {i18n.t("helps.settings.delete")}
                                            </ButtonWithSpinner>
                                        </Grid>
                                    ) : null}
                                    <Grid item>
                                        <ButtonWithSpinner 
                                            loading={loading} 
                                            type="submit" 
                                            variant="contained" 
                                            color="primary"
                                        >
                                            {i18n.t("helps.settings.save")}
                                        </ButtonWithSpinner>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Form>
                )}
            </Formik>
            
            {/* Modal para criar categoria */}
            <CategoryModal
                open={categoryModalOpen}
                onClose={handleCloseCategoryModal}
                onSave={handleCreateCategory}
                onUpdate={handleUpdateCategory}
                categories={categories}
                onEdit={handleEditCategory}
                onDelete={handleDeleteCategory}
                onRefresh={loadCategories}
                editingCategory={editingCategory}
            />
        </>
    )
}

export function HelpsManagerGrid (props) {
    const { records, onSelect, onDelete } = props
    const classes = useStyles()

    const handleEdit = (record) => {
        onSelect(record);
    };

    const handleDelete = (record) => {
        if (onDelete) {
            onDelete(record);
        }
    };

    return (
        <Paper className={classes.tableContainer}>
            <Table className={classes.fullWidth} size="small" aria-label="a dense table">
                <TableHead>
                <TableRow>
                    <TableCell align="center" style={{width: '1%'}}>#</TableCell>
                    <TableCell align="left">Título</TableCell>
                    <TableCell align="left">{i18n.t("helps.settings.description")}</TableCell>
                    <TableCell align="left">Categoria</TableCell>
                    <TableCell align="left">Video</TableCell>
                    <TableCell align="center" style={{width: '120px'}}>Ações</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {records.map((row) => (
                    <TableRow key={row.id}>
                        <TableCell align="center" style={{width: '1%'}}>
                            {row.id}
                        </TableCell>
                        <TableCell align="left" style={{
                            maxWidth: '200px',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {row.title || '-'}
                        </TableCell>
                        <TableCell align="left" style={{
                            maxWidth: '300px',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            wordBreak: 'break-word',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {row.description || '-'}
                        </TableCell>
                        <TableCell align="left">{row.category || '-'}</TableCell>
                        <TableCell align="left">{row.video || '-'}</TableCell>
                        <TableCell align="center">
                            <Tooltip title="Editar">
                                <IconButton 
                                    onClick={() => handleEdit(row)} 
                                    size="small"
                                    color="primary"
                                >
                                    <EditIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Deletar">
                                <IconButton 
                                    onClick={() => handleDelete(row)} 
                                    size="small"
                                    color="secondary"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </Paper>
    )
}

export default function HelpsManager () {
    const classes = useStyles()
    const { list, save, update, remove } = useHelps()
    
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [loading, setLoading] = useState(false)
    const [records, setRecords] = useState([])
    const [record, setRecord] = useState({
        title: '',
        description: '',
        video: '',
        category: '',
        categoryIcon: ''
    })

    useEffect(() => {
        async function fetchData () {
            await loadHelps()
        }
        fetchData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadHelps = async () => {
        setLoading(true)
        try {
            const helpList = await list()
            setRecords(helpList)
        } catch (e) {
            toast.error('Não foi possível carregar a lista de registros')
        }
        setLoading(false)
    }

    const handleSubmit = async (data) => {
        setLoading(true)
        try {
            if (data.id !== undefined) {
                await update(data)
            } else {
                await save(data)
            }
            await loadHelps()
            handleCancel()
            toast.success('Operação realizada com sucesso!')
        } catch (e) {
            toast.error('Não foi possível realizar a operação. Verifique se já existe uma helpo com o mesmo nome ou se os campos foram preenchidos corretamente')
        }
        setLoading(false)
    }

    const handleDelete = async () => {
        setLoading(true)
        try {
            await remove(record.id)
            await loadHelps()
            handleCancel()
            toast.success('Operação realizada com sucesso!')
        } catch (e) {
            toast.error('Não foi possível realizar a operação')
        }
        setLoading(false)
    }

    const handleOpenDeleteDialog = (recordToDelete) => {
        if (recordToDelete) {
            setRecord({
                id: recordToDelete.id,
                title: recordToDelete.title || '',
                description: recordToDelete.description || '',
                video: recordToDelete.video || '',
                category: recordToDelete.category || '',
                categoryIcon: recordToDelete.categoryIcon || ''
            });
        }
        setShowConfirmDialog(true);
    }

    const handleCancel = () => {
        setRecord({
            title: '',
            description: '',
            video: '',
            category: '',
            categoryIcon: ''
        })
    }

    const handleSelect = (data) => {
        setRecord({
            id: data.id,
            title: data.title || '',
            description: data.description || '',
            video: data.video || '',
            category: data.category || '',
            categoryIcon: data.categoryIcon || ''
        })
    }

    return (
        <Paper className={classes.mainPaper} elevation={0}>
            <Grid spacing={0} container>
                <Grid xs={12} item>
                    <HelpManagerForm 
                        initialValue={record} 
                        onDelete={handleOpenDeleteDialog} 
                        onSubmit={handleSubmit} 
                        onCancel={handleCancel} 
                        loading={loading}
                    />
                </Grid>
                <Grid xs={12} item>
                    <HelpsManagerGrid 
                        records={records}
                        onSelect={handleSelect}
                        onDelete={handleOpenDeleteDialog}
                    />
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
    )
}