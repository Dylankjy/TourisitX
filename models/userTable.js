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

            email: {
                type: DataTypes.STRING(32),
                allowNull: false,
            },

            phone_number: {
                type: DataTypes.STRING(8),
                allowNull: true,
            },

            bio: {
                type: DataTypes.STRING(64),
                allowNull: false,
                defaultValue: 'Your friendly tourisit user',
            },

            profile_img: {
                type: DataTypes.STRING(64),
                allowNull: false,
                defaultValue: 'TODO', // TODO: Please set this to the value of the default profile picture.
            },

            lastseen_time: {
                type: DataTypes.DATE,
                allowNull: false,
            },

            stripe_id: {
                type: DataTypes.STRING(128),
                allowNull: true,
            },

            wishlist: {
                type: DataTypes.STRING(512),
                allowNull: true,
            },

            fb: {
                type: DataTypes.STRING(32),
                allowNull: true,
            },

            insta: {
                type: DataTypes.STRING(32),
                allowNull: true,
            },

            li: {
                type: DataTypes.STRING(32),
                allowNull: true,
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

            is_admin: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                // validate: {
                //     isIn: [[0, 1]],
                // },
            },

            is_tourguide: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },

            verified: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            },

            ip_address: {
                type: DataTypes.STRING(16),
                allowNull: false,
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
    }

    return User
}
