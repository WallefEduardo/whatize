import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Adicionar novos campos de dados pessoais/profissionais
      await queryInterface.addColumn("Users", "telefone", {
        type: DataTypes.STRING(20),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "cargo", {
        type: DataTypes.STRING(100),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "departamento", {
        type: DataTypes.STRING(100),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "dataAdmissao", {
        type: DataTypes.DATEONLY,
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "sobre", {
        type: DataTypes.TEXT,
        allowNull: true,
      }, { transaction });

      // Adicionar campos de endereço
      await queryInterface.addColumn("Users", "cep", {
        type: DataTypes.STRING(10),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "endereco", {
        type: DataTypes.STRING(255),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "numero", {
        type: DataTypes.STRING(10),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "complemento", {
        type: DataTypes.STRING(100),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "bairro", {
        type: DataTypes.STRING(100),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "cidade", {
        type: DataTypes.STRING(100),
        allowNull: true,
      }, { transaction });

      await queryInterface.addColumn("Users", "estado", {
        type: DataTypes.STRING(2),
        allowNull: true,
      }, { transaction });
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.sequelize.transaction(async (transaction) => {
      // Remover campos de endereço
      await queryInterface.removeColumn("Users", "estado", { transaction });
      await queryInterface.removeColumn("Users", "cidade", { transaction });
      await queryInterface.removeColumn("Users", "bairro", { transaction });
      await queryInterface.removeColumn("Users", "complemento", { transaction });
      await queryInterface.removeColumn("Users", "numero", { transaction });
      await queryInterface.removeColumn("Users", "endereco", { transaction });
      await queryInterface.removeColumn("Users", "cep", { transaction });

      // Remover campos de dados pessoais/profissionais
      await queryInterface.removeColumn("Users", "sobre", { transaction });
      await queryInterface.removeColumn("Users", "dataAdmissao", { transaction });
      await queryInterface.removeColumn("Users", "departamento", { transaction });
      await queryInterface.removeColumn("Users", "cargo", { transaction });
      await queryInterface.removeColumn("Users", "telefone", { transaction });
    });
  }
};