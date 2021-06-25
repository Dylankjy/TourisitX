const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
     class Support extends Model {
          //
     }

     Support.init(
          {
               ticket_id: {
                    allowNull: false,
                    primaryKey: true,
                    type: DataTypes.UUID,
               },

               uid: {
                    allowNull: false,
                    type: DataTypes.UUID,
               },

               u_email: {
                    type: DataTypes.STRING(64),
                    allowNull: false,
               },

               support_type: {
                    type: DataTypes.STRING(32),
                    allowNull: false,
               },

               content: {
                    type: DataTypes.STRING(64),
                    allowNull: false,
               },

               link: {
                    type: DataTypes.STRING(64),
                    allowNull: true,
               },

               status: {
                    type: DataTypes.STRING(64),
                    allowNull: false,
               },
          },

          { /* hon hon french bread */
               sequelize,
               tableName: 'Support',
               modelName: 'Support',
          },
     )

     return Support
}
