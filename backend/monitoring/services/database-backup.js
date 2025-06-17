const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

class DatabaseBackup {
    constructor() {
        this.dbHost = process.env.DB_HOST || 'localhost';
        this.dbPort = process.env.DB_PORT || '5432';
        this.dbUser = process.env.DB_USER;
        this.dbPass = process.env.DB_PASS;
        this.dbName = process.env.DB_NAME;
        this.backupDir = path.join(__dirname, '../../backups');
        
        // Garantir que a pasta de backup existe
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }
    }

    generateBackupFilename() {
        const now = new Date();
        const timestamp = now.toISOString()
            .replace(/:/g, '-')
            .replace(/\./g, '-')
            .slice(0, 19);
        return `backup_${this.dbName}_${timestamp}.sql`;
    }

    async createBackup() {
        return new Promise((resolve, reject) => {
            const filename = this.generateBackupFilename();
            const backupPath = path.join(this.backupDir, filename);
            
            // Comando pg_dump
            const command = `PGPASSWORD="${this.dbPass}" pg_dump -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${this.dbName} --no-password --verbose --clean --no-acl --no-owner -f "${backupPath}"`;
            
            console.log('🔄 Iniciando backup do banco de dados...');
            console.log(`📁 Arquivo: ${filename}`);
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Erro ao criar backup:', error.message);
                    reject(error);
                    return;
                }
                
                // Verificar se o arquivo foi criado
                if (fs.existsSync(backupPath)) {
                    const stats = fs.statSync(backupPath);
                    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
                    
                    console.log('✅ Backup criado com sucesso!');
                    console.log(`📊 Tamanho: ${fileSizeMB} MB`);
                    console.log(`📍 Local: ${backupPath}`);
                    
                    resolve({
                        success: true,
                        filename,
                        path: backupPath,
                        size: fileSizeMB + ' MB',
                        timestamp: new Date().toISOString()
                    });
                } else {
                    reject(new Error('Arquivo de backup não foi criado'));
                }
            });
        });
    }

    listBackups() {
        try {
            const files = fs.readdirSync(this.backupDir)
                .filter(file => file.startsWith('backup_') && file.endsWith('.sql'))
                .map(file => {
                    const filePath = path.join(this.backupDir, file);
                    const stats = fs.statSync(filePath);
                    return {
                        filename: file,
                        size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
                        created: stats.birthtime.toLocaleString('pt-BR'),
                        path: filePath
                    };
                })
                .sort((a, b) => new Date(b.created) - new Date(a.created));
            
            return files;
        } catch (error) {
            console.error('Erro ao listar backups:', error);
            return [];
        }
    }

    cleanOldBackups(keepCount = 5) {
        try {
            const backups = this.listBackups();
            
            if (backups.length <= keepCount) {
                console.log(`📦 ${backups.length} backups encontrados (mantendo todos)`);
                return { removed: 0, kept: backups.length };
            }
            
            const toRemove = backups.slice(keepCount);
            let removedCount = 0;
            
            toRemove.forEach(backup => {
                try {
                    fs.unlinkSync(backup.path);
                    console.log(`🗑️  Removido: ${backup.filename}`);
                    removedCount++;
                } catch (error) {
                    console.error(`Erro ao remover ${backup.filename}:`, error.message);
                }
            });
            
            console.log(`🧹 Limpeza concluída: ${removedCount} backups removidos, ${keepCount} mantidos`);
            return { removed: removedCount, kept: keepCount };
        } catch (error) {
            console.error('Erro na limpeza de backups:', error);
            return { removed: 0, kept: 0, error: error.message };
        }
    }

    async testConnection() {
        return new Promise((resolve, reject) => {
            const command = `PGPASSWORD="${this.dbPass}" psql -h ${this.dbHost} -p ${this.dbPort} -U ${this.dbUser} -d ${this.dbName} -c "SELECT version();" --no-password`;
            
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(stdout);
            });
        });
    }
}

// Se executado diretamente
if (require.main === module) {
    const backup = new DatabaseBackup();
    
    const action = process.argv[2];
    
    switch (action) {
        case 'create':
            backup.createBackup()
                .then(result => {
                    console.log('✅ Backup concluído:', result);
                    process.exit(0);
                })
                .catch(error => {
                    console.error('❌ Falha no backup:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'list':
            const backups = backup.listBackups();
            console.log('\n📦 BACKUPS DISPONÍVEIS:');
            console.log('========================');
            if (backups.length === 0) {
                console.log('Nenhum backup encontrado.');
            } else {
                backups.forEach((backup, index) => {
                    console.log(`${index + 1}. ${backup.filename}`);
                    console.log(`   📊 Tamanho: ${backup.size}`);
                    console.log(`   📅 Criado: ${backup.created}`);
                    console.log('');
                });
            }
            break;
            
        case 'clean':
            const keepCount = parseInt(process.argv[3]) || 5;
            backup.cleanOldBackups(keepCount);
            break;
            
        case 'test':
            backup.testConnection()
                .then(result => {
                    console.log('✅ Conexão com banco OK');
                    console.log('📊 Versão:', result.split('\n')[0]);
                })
                .catch(error => {
                    console.error('❌ Erro de conexão:', error.message);
                    process.exit(1);
                });
            break;
            
        default:
            console.log('📖 USO:');
            console.log('  node database-backup.js create  - Criar backup');
            console.log('  node database-backup.js list    - Listar backups');
            console.log('  node database-backup.js clean [N] - Manter apenas N backups (padrão: 5)');
            console.log('  node database-backup.js test    - Testar conexão');
            break;
    }
}

module.exports = DatabaseBackup; 