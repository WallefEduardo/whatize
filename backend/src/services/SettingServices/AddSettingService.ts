import Setting from "../../models/Setting";

const AddSettingService = async () => {
    try {
        const newSetting = {
            key: "wtV",
            value: "disabled",
            createdAt: new Date(),
            updatedAt: new Date(),
            companyId: null
        }
        await Setting.create(newSetting);

    } catch (error) {
        console.error('Erro ao adicionar configuração:', error);
    }
};

export default AddSettingService;