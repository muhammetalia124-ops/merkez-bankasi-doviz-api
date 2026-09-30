const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { rejectUnauthorized: false }
  }
});

const Kur = sequelize.define('Kurlar', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tarih: {
    type: DataTypes.STRING,
    allowNull: false
  },
  kod: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isim: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dovizAlis: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dovizSatis: {
    type: DataTypes.STRING,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Kurlar',
  timestamps: false
});

async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    await Kur.sync({ force: false });

    const indexes = await sequelize.getQueryInterface().showIndex('Kurlar');
    if (!indexes.some((index) => index.name === 'idx_kurlar_tarih_kod')) {
      await sequelize.getQueryInterface().addIndex('Kurlar', ['tarih', 'kod'], {
        unique: true,
        name: 'idx_kurlar_tarih_kod'
      });
    }

    console.log('Veritabanı hazır.');
  } catch (err) {
    console.error('Veritabanı başlatılamadı:', err.message);
    throw err;
  }
}

module.exports = { sequelize, Kur, initializeDatabase };
