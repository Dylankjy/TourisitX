// Custom validators here
// Instructions at the bottom

class Validator {
    constructor(data) {
        this.data = data
    }

    // Used to initialize the validation. Specify the input name, error message to display if false and the name of element to render when showing error
    Initialize(options) {
        // Reset the result attribute to true (Make result an instance attribute, not a class attribute so I remove it from the constructor)
        this.result = true
        this.name = options.name
        this.errMsg = options.errorMessage
        return this
    }

    // Checks if the element is empty
    exists() {
        if (!this.data[this.name]) {
            this.result = false
            return this
        }
        return this
    }

    // Checks if a string's length falls within the specified range
    isLength(options) {
        const min = options.min
        const max = options.max
        if ((this.data[this.name].toString().length < min) || (this.data[this.name].length > max)) {
            this.result = false
            return this
        }
        // if ((this.data[name]).toString().length < min) return false
        return this
    }

    // Checks if a numerical value is between a given range
    isValue(options) {
        const min = options.min
        const max = options.max

        // If it is a number then I'll validate
        if (!isNaN(this.data[this.name])) {
            if ((this.data[this.name] < min) || (this.data[this.name] > max)) {
                this.result = false
                return this
            }
        } else {
            throw new Error('Only accept Numeric values')
        }
        return this
    }

    // Checks if the string contains a certain value
    contains(text) {
        if (this.data[this.name].includes(text) == false) {
            this.result = false
            return this
        }
        return this
    }

    // Checks that first input value == second input value
    isEqual(field2) {
        if (!(this.data[this.name] === field2)) {
            this.result = false
            return this
        }

        return this
    }
    // Returns the JSON result of the validation
    getResult() {
        if (this.result == false) {
            return { result: this.result, msg: this.errMsg }
        }
        return null
    }
}


class FileValidator {
    constructor(data) {
        this.data = data
    }

    Initialize(options) {
        this.result = true
        this.errMsg = options.errorMessage
        return this
    }

    fileExists() {
        if (this.data['size'] == 0) {
            this.result = false
            return this
        }
        return this
    }

    sizeAllowed(options) {
        if (this.data['size'] > options.maxSize) {
            this.result = false
        }
        return this
    }

    extAllowed(allowedExtensions) {
        const extName = path.extname(this.data['name'])
        if (!allowedExtensions.includes(extName)) {
            this.result = false
        }
        return this
    }


    getResult() {
        if (this.result == false) {
            return { result: this.result, msg: this.errMsg }
        }
        return null
    }
}

module.exports = {
    FileValidator, Validator,
}

// Examples

// const postData = { 'theName': 'Jaddke', 'theAge': 4 }

// const v = new Validator(postData)
// nameResult = v.Initialize({ name: 'theName', errorMessage: 'Needs to be 5 chars!' }).exists().isLength({ min: 6 })
//     .getResult()

// ageResult = v.Initialize({ name: 'theAge', errorMessage: 'Minimum age is 10' }).exists().isValue({ min: 10 })
//     .getResult()

// const allResults = [nameResult, ageResult]
// console.log(allResults)

