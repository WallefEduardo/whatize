import api from "../../services/api";

const useHelps = () => {

    const findAll = async (params) => {
        const { data } = await api.request({
            url: `/helps`,
            method: 'GET',
            params
        });
        return data;
    }

    const getCategories = async () => {
        try {
            console.log('🔧 useHelps.getCategories: Iniciando...');
            // Usar o endpoint /helps/categories que tem a contagem
            const { data } = await api.request({
                url: '/helps/categories',
                method: 'GET'
            });
            console.log('📂 Categorias carregadas do endpoint /helps/categories:', data);
            console.log('📊 Tipo de data:', typeof data);
            console.log('📋 Data.categories:', data.categories);
            
            // Os dados já vêm no formato correto do backend
            const result = data.categories || [];
            console.log('✅ Resultado final:', result);
            return result;
        } catch (error) {
            console.error('❌ Erro ao buscar categorias:', error);
            // Fallback para o endpoint /categories se o primeiro falhar
            try {
                console.log('🔄 Tentando fallback para /categories...');
                const { data } = await api.request({
                    url: '/categories',
                    method: 'GET'
                });
                console.log('📂 Fallback - Categorias carregadas do endpoint /categories:', data);
                
                // Converter para o formato esperado pelo sidebar
                const categoriesFormatted = data.map(category => ({
                    category: category.name,
                    categoryIcon: category.icon || 'Help',
                    count: 0 // Sem contagem no fallback
                }));
                
                console.log('✅ Fallback - Resultado formatado:', categoriesFormatted);
                return categoriesFormatted;
            } catch (fallbackError) {
                console.error('❌ Erro no fallback:', fallbackError);
                throw error;
            }
        }
    }

    const createCategory = async (categoryData) => {
        try {
            console.log('🔧 Criando categoria:', categoryData);
            
            // Criar a categoria com ícone predefinido
            const { data: category } = await api.request({
                url: '/categories',
                method: 'POST',
                data: {
                    name: categoryData.name,
                    icon: categoryData.icon // Nome do ícone Material-UI
                }
            });

            console.log('✅ Categoria criada:', category);
            return category;
        } catch (error) {
            console.error('❌ Erro ao criar categoria:', error);
            throw error;
        }
    }

    const listCategories = async () => {
        try {
            const { data } = await api.request({
                url: '/categories',
                method: 'GET'
            });
            console.log('📂 Categorias carregadas do endpoint /categories:', data);
            return data;
        } catch (error) {
            console.error('❌ Erro ao listar categorias:', error);
            throw error;
        }
    }

    const updateCategory = async (id, categoryData) => {
        try {
            console.log('🔧 Atualizando categoria:', { id, categoryData });
            
            // Atualizar a categoria com ícone predefinido
            const { data: category } = await api.request({
                url: `/categories/${id}`,
                method: 'PUT',
                data: {
                    name: categoryData.name,
                    icon: categoryData.icon // Nome do ícone Material-UI
                }
            });

            console.log('✅ Categoria atualizada:', category);
            return category;
        } catch (error) {
            console.error('❌ Erro ao atualizar categoria:', error);
            throw error;
        }
    }

    const deleteCategory = async (id) => {
        const { data } = await api.request({
            url: `/categories/${id}`,
            method: 'DELETE'
        });
        return data;
    }

    const list = async (params) => {
        const { data } = await api.request({
            url: '/helps/list',
            method: 'GET',
            params
        });
        return data.records || data; // Compatibilidade com ambos os formatos
    }

    const save = async (data) => {
        const { data: responseData } = await api.request({
            url: '/helps',
            method: 'POST',
            data
        });
        return responseData;
    }

    const update = async (data) => {
        const { data: responseData } = await api.request({
            url: `/helps/${data.id}`,
            method: 'PUT',
            data
        });
        return responseData;
    }

    const remove = async (id) => {
        const { data } = await api.request({
            url: `/helps/${id}`,
            method: 'DELETE'
        });
        return data;
    }

    return {
        findAll,
        list,
        save,
        update,
        remove,
        getCategories,
        createCategory,
        listCategories,
        updateCategory,
        deleteCategory
    }
}

export default useHelps;