import User from "../../src/models/User";
import CreateUserService from "../../src/services/UserServices/CreateUserService";
import { Sequelize } from "sequelize-typescript";

describe("UserRegister New Fields Integration", () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    // Use the test database configuration
    const { Sequelize } = require("sequelize-typescript");
    const config = require("../../dist/config/database").default;
    
    sequelize = new Sequelize(config.test);
    sequelize.addModels([User]);
    
    try {
      await sequelize.authenticate();
      console.log("Database connection established successfully.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  });

  afterAll(async () => {
    if (sequelize) {
      await sequelize.close();
    }
  });

  it("should create user with new profile fields", async () => {
    const userData = {
      name: "João Silva Teste",
      email: `teste.joao.${Date.now()}@example.com`,
      password: "123456",
      profile: "user",
      companyId: 1,
      // Novos campos de dados pessoais/profissionais
      telefone: "(11) 99999-9999",
      cargo: "Desenvolvedor",
      departamento: "TI",
      dataAdmissao: new Date("2025-01-01"),
      sobre: "Desenvolvedor full-stack especializado em React e Node.js",
      // Novos campos de endereço
      cep: "12345-678",
      endereco: "Rua das Flores, 123",
      numero: "123",
      complemento: "Apto 45",
      bairro: "Centro",
      cidade: "São Paulo",
      estado: "SP",
    };

    const user = await CreateUserService(userData);

    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    
    // Verificar se o usuário foi criado no banco com os novos campos
    const createdUser = await User.findByPk(user.id);
    
    expect(createdUser).toBeDefined();
    expect(createdUser.telefone).toBe(userData.telefone);
    expect(createdUser.cargo).toBe(userData.cargo);
    expect(createdUser.departamento).toBe(userData.departamento);
    expect(createdUser.sobre).toBe(userData.sobre);
    expect(createdUser.cep).toBe(userData.cep);
    expect(createdUser.endereco).toBe(userData.endereco);
    expect(createdUser.numero).toBe(userData.numero);
    expect(createdUser.complemento).toBe(userData.complemento);
    expect(createdUser.bairro).toBe(userData.bairro);
    expect(createdUser.cidade).toBe(userData.cidade);
    expect(createdUser.estado).toBe(userData.estado);
    
    // Limpar dados de teste
    await createdUser.destroy();
  });

  it("should create user with old fields only (backward compatibility)", async () => {
    const userData = {
      name: "Maria Santos Teste",
      email: `teste.maria.${Date.now()}@example.com`,
      password: "123456",
      profile: "user",
      companyId: 1,
      startWork: "08:00",
      endWork: "18:00"
    };

    const user = await CreateUserService(userData);

    expect(user).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    
    // Verificar se o usuário foi criado no banco sem quebrar a funcionalidade antiga
    const createdUser = await User.findByPk(user.id);
    
    expect(createdUser).toBeDefined();
    expect(createdUser.startWork).toBe(userData.startWork);
    expect(createdUser.endWork).toBe(userData.endWork);
    
    // Os novos campos devem ser null/undefined quando não fornecidos
    expect(createdUser.telefone).toBeFalsy();
    expect(createdUser.cargo).toBeFalsy();
    
    // Limpar dados de teste
    await createdUser.destroy();
  });
});