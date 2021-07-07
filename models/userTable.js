const { Model } = require('sequelize')

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        //
    }

    User.init(
        {
            id: {
                allowNull: false,
                primaryKey: true,
                type: DataTypes.UUID,
            },

            name: {
                allowNull: false,
                type: DataTypes.STRING(128),
            },

            password: {
                type: DataTypes.STRING(64),
                allowNull: false,
            },

            lastseen_time: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            email: {
                type: DataTypes.STRING(254),
                allowNull: false,
            },

            phone_number: {
                type: DataTypes.STRING(8),
                allowNull: true,
            },

            profile_img: {
                type: DataTypes.STRING(64),
                allowNull: false,
                defaultValue: 'TODO', // TODO: Please set this to the value of the default profile picture.
            },

            bio: {
                type: DataTypes.STRING(254),
                allowNull: false,
                defaultValue: 'Your friendly tourisit user',
            },

            email_status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            phone_status: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            stripe_id: {
                type: DataTypes.STRING(128),
                allowNull: true,
            },

            wishlist: {
                type: DataTypes.STRING(8192),
                allowNull: true,
                defaultValue: '',
            },

            is_admin: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            is_banned: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            is_tourguide: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            is_verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            ip_address: {
                type: DataTypes.STRING(256),
                allowNull: false,
            },

            fb: {
                type: DataTypes.STRING(64),
                allowNull: true,
            },

            insta: {
                type: DataTypes.STRING(64),
                allowNull: true,
            },

            li: {
                type: DataTypes.STRING(64),
                allowNull: true,
            },
        },

        { /* hon hon french bread */
            sequelize,
            tableName: 'User',
            modelName: 'User',
        },
    )

    User.associate = (models) => {
        User.hasMany(models.Session, {
            onDelete: 'cascade',
            foreignKey: 'userId',
        })

        User.hasMany(models.Token, {
            onDelete: 'cascade',
            foreignKey: 'userId',
        })

        User.hasMany(models.ChatMessages, {
            onDelete: 'cascade',
            foreignKey: 'senderId',
        })

        User.hasMany(models.Shop, {
            onDelete: 'cascade',
            foreignKey: 'userId',
        })
    }

    return User
}
