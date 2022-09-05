const Todo = require('../models/Todo')
const User = require('../models/User')

module.exports = {
    getTodos: async (req, res) => {
        console.log(req.user)
        try {
            let todoItems = await Todo.find({ userId: req.user.id })
            // temporary to fix broken users
            console.log("length check", todoItems.length, req.user.todoList.length)
            if (req.user.todoList == undefined || todoItems.length != req.user.todoList.length) {
                await User.updateOne({ _id: req.user.id }, { todoList: todoItems.map(e => e._id) })
            }
            const itemsLeft = await Todo.countDocuments({ userId: req.user.id, completed: false })
            todoItems.sort((a, b) => req.user.todoList.indexOf(a._id) - req.user.todoList.indexOf(b._id))
            res.render('todos.ejs', { todos: todoItems, left: itemsLeft, user: req.user, order: todoItems })
        } catch (err) {
            console.log(err)
        }
    },
    createTodo: async (req, res) => {
        try {
            const createData = await Todo.create({ todo: req.body.todoItem, completed: false, userId: req.user.id, priority: parseInt(req.body.priority) })
            if (isNaN(req.body.priority)) {
                await User.updateOne({ _id: req.user.id }, { $push: { todoList: createData._id } })
            } else {
                const reorderedTodos = req.user.todoList.slice(0, parseInt(req.body.priority) - 1)
                    .concat(createData._id)
                    .concat(req.user.todoList.slice(parseInt(req.body.priority) - 1))
                await User.updateOne({ _id: req.user.id }, { todoList: reorderedTodos })
            }
            console.log('Todo has been added!')
            res.redirect('/todos')
        } catch (err) {
            console.log(err)
        }
    },
    markComplete: async (req, res) => {
        try {
            await Todo.findOneAndUpdate({ _id: req.body.todoIdFromJSFile }, {
                completed: true
            })
            console.log('Marked Complete')
            res.json('Marked Complete')
        } catch (err) {
            console.log(err)
        }
    },
    markIncomplete: async (req, res) => {
        try {
            await Todo.findOneAndUpdate({ _id: req.body.todoIdFromJSFile }, {
                completed: false
            })
            console.log('Marked Incomplete')
            res.json('Marked Incomplete')
        } catch (err) {
            console.log(err)
        }
    },
    deleteTodo: async (req, res) => {
        console.log(req.body.todoIdFromJSFile)
        try {
            await Todo.findOneAndDelete({ _id: req.body.todoIdFromJSFile })
            await User.updateOne({ _id: req.user.id }, { $pull: { todoList: req.body.todoIdFromJSFile } })
            console.log('Deleted Todo')
            res.json('Deleted It')
        } catch (err) {
            console.log(err)
        }
    },
    upTodo: async (req, res) => {
        try {
            //const user = await User.findOne({ _id: req.user.id })
            let currentIndex = req.user.todoList.indexOf(req.body.todoIdFromJSFile)
            console.log(currentIndex)
            if (currentIndex > 0) {
                console.log("uptood")
                const tmp = req.user.todoList[currentIndex]
                req.user.todoList[currentIndex] = req.user.todoList[currentIndex - 1]
                req.user.todoList[currentIndex - 1] = tmp
            }
            await User.updateOne({ _id: req.user.id }, { todoList: req.user.todoList })
            res.json('upTodoed')
        } catch (err) {
            console.log(err)
        }
    },
    downTodo: async (req, res) => {
        try {
            //const user = await User.findOne({ _id: req.user.id })
            let currentIndex = req.user.todoList.indexOf(req.body.todoIdFromJSFile)
            if (currentIndex < req.user.todoList.length - 1) {
                const tmp = req.user.todoList[currentIndex]
                req.user.todoList[currentIndex] = req.user.todoList[currentIndex + 1]
                req.user.todoList[currentIndex + 1] = tmp
            }
            await User.updateOne({ _id: req.user.id }, { todoList: req.user.todoList })
            res.json('downTodoed')
        } catch (err) {
            console.log(err)
        }
    }
}    