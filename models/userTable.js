models = require('./')

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
            allowNull: true,
        },

        bio: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        profile_img: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        registration_time: {
            type: DataTypes.DATE,
            allowNull: false,
        },

        stripe_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        wishlist: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        fb: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        insta: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        li: {
            type: DataTypes.STRING,
            allowNull: true,
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

    User.associate = (models) => {
        User.hasMany(models.Session, {
            onDelete: 'cascade',
        })
    }

    return User
}
