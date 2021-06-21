module.exports = (sequelize, DataTypes) => {
     const User = sequelize.define('User', {

          id: {
               allowNull: false,
               primaryKey: true,
               type: DataTypes.UUID,
          },

          name: {
               allowNull: false,
               type: DataTypes.STRING,
          },

          password: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          email: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          phone_number: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          bio: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          profile_img: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          registration_time: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          stripe_id: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          wishlist: {
               type: DataTypes.ARRAY,
               allowNull: false,
          },

          fb: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          insta: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          li: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          email_status: {
               type: DataTypes.BOOLEAN,
               allowNull: false,
          },
          
          phone_status: {
               type: DataTypes.BOOLEAN,
               allowNull: false,
          },

          account_type: {
               type: DataTypes.STRING,
               allowNull: false,
          },

          verified: {
               type: DataTypes.BOOLEAN,
               allowNull: false,
          },

          ip_address: {
               type: DataTypes.STRING,
               allowNull: false,
          },

     },

          {
               tableName: 'User',
          })

     return User
}
