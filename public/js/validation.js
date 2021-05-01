// Custom validators here
// Instructions at the bottom

class Validator {
    constructor(data) {
        this.data = data
        this.result = true
    }

    // Used to initialize the validation. Specify the input name and the error message to display if false
    Initialize(options) {
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

    // Returns the JSON result of the validation
    getResult() {
        if (this.result == false) {
            return { name: this.name, result: this.result, msg: this.errMsg }
        }
        return { name: this.name, result: this.result }
    }
}

/*
Note:
-  Always initialize the class first, using the Initialize method
-  Always end off with the getResult() method to get the results of the validation. A Json object will be returned with result =  true/false and the relevant errMsg if needed

Your result will look as such:
{ name: 'theName', result: false, msg: 'Needs to be 5 chars!' }


To Use custom validator:

1. Initialize the validator, passing in the POST Json Data
var x = Validator()

2. Call the Initialize method of the class, passing in the name and error message to display
x.Initialize({name: "theName", errorMessage: "Name must be 7 characters long"})

^ This will validate the field <input name='theName'> and if there is an error found later, it will throw "Name must be 7 characters long"

3. The Validator class supports chaining.
x.Initialize({blahblah..}).exists().isLength({min: 3, max: 8})

^ This will call the exists() method, which checks whether the string is empty or not
The isLength() method will then be called which checks whether the string is more than 2 chars and less than 9 chars

4. Get the result by calling the getResult() method
x.Initialize({name: "theName", errorMessage: "Name must be 8 characters long"})
.exists().isLength({min: 3, max: 8})
.getResult()

^ This will return an object { name: 'theName', result: false, msg: 'Name must be 8 characters long' } if validation FAILED
Else, it will return  { name: 'theName', result: true }

 */

// Examples

const postData = { 'theName': 'Jaddke', 'theAge': 4 }

const v = new Validator(postData)
nameResult = v.Initialize({ name: 'theName', errorMessage: 'Needs to be 5 chars!' }).exists().isLength({ min: 6 })
    .getResult()

ageResult = v.Initialize({ name: 'theAge', errorMessage: 'Minimum age is 10' }).exists().isValue({ min: 10 })
    .getResult()

const allResults = [nameResult, ageResult]
console.log(allResults)

