import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.addColumn("Messages", "userId", {
      type: DataTypes.INTEGER,
      allowNull: true, // Nullable para compatibilidade com mensagens existentes
      references: { 
        model: "Users", 
        key: "id" 
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL" // Se usuário for deletado, mensagem não é perdida
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.removeColumn("Messages", "userId");
  }
};