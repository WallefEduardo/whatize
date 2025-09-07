import { DataTypes, QueryInterface } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("CompletedTasks", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        unique: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM("todo", "inprogress", "completed"),
        allowNull: false,
        defaultValue: "completed"
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high"),
        allowNull: false,
        defaultValue: "medium"
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      assignedToId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdById: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      completedById: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: false
      },
      originalStatus: {
        type: DataTypes.ENUM("todo", "inprogress"),
        allowNull: false
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }).then(() => {
      // Criar indexes para performance
      return Promise.all([
        queryInterface.addIndex("CompletedTasks", ["companyId"]),
        queryInterface.addIndex("CompletedTasks", ["assignedToId"]),
        queryInterface.addIndex("CompletedTasks", ["createdById"]),
        queryInterface.addIndex("CompletedTasks", ["completedById"]),
        queryInterface.addIndex("CompletedTasks", ["priority"]),
        queryInterface.addIndex("CompletedTasks", ["completedAt"]),
        queryInterface.addIndex("CompletedTasks", ["uuid"], { unique: true })
      ]);
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("CompletedTasks");
  }
};