import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Stickers", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Nome/descrição do sticker"
      },
      mediaUrl: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "URL do arquivo do sticker (WebP)"
      },
      mediaType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "sticker"
      },
      fileName: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Nome original do arquivo"
      },
      fileSize: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: "Tamanho do arquivo em bytes"
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
        comment: "Usuário dono do sticker"
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
        comment: "Company para isolamento multi-tenant"
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: "Ordem de exibição na biblioteca"
      },
      isFavorite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: "Se está marcado como favorito"
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("Stickers");
  }
};
