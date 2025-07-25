import { json } from "express"
import User from "../models/user.model.js"
import bycrypt, { genSalt } from "bcryptjs"
import { generateToken } from "../lib/utils.js"
import cloudinary from "../lib/cloudinary.js"

export const signup = async(req,res)=>{
    const{fullName,password,email} = req.body
    try {
        if(!fullName || !email || !password){
            return res.status(400).json({ message: "All fields are required"});
        }
        if(password.length<6){
            return res.status(400).json({ message: "password must be atleast 6 characters"});
        }

        const user= await User.findOne({email})

        if(user){
            return res.status(400).json({ message: "Email already exists"});
        }

        const salt= await bycrypt.genSalt(10)
        const hashedPassword = await bycrypt.hash(password, salt)

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        })


        if(newUser){
            generateToken(newUser._id, res)
            await newUser.save();
            return res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
                createdAt: newUser.createdAt,
            });
        }else{
            return res.status(400).json({ message: "Invalid user data"});
        }

    } catch (error) {
        console.log("error in signup controller", error.message);
        return res.status(500).json({ message: "Internal server error"});
    }
}

export const login = async(req,res)=>{
   const {email, password} = req.body
    try {
        const user = await User.findOne({email})
        if(!user){
            return res.status(404).json({message:"Invalid credentials" })
        }

        const isPasswordCorrect = await bycrypt.compare(password, user.password)

        if(!isPasswordCorrect){
            return res.status(404).json({message:"Invalid credentials" })
        }

        generateToken(user._id, res)

        return res.status(200).json({
            _id:user._id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic,
            createdAt: user.createdAt,

        })

    } catch (error) {
        console.log("Error in login controller", error.message);
        return res.status(500).json({message: "internal sever error"});
    }
}

export const logout = (req,res)=>{
    try {
        res.cookie("jwt", "", {maxAge:0});
        res.status(200).json({message:"Logged out successfully"});
    } catch (error) {
        console.log("Error in logout terminal", error.message);
        res.status(500).json({message:"Internal Server error"});
    }
}

export const updateProfile = async(req,res)=>{
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic){
          return res.status(404).json({message:"Profile Pic is required"})
        }
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {profilePic: uploadResponse.secure_url},
            {new: true}
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("error in update profile", error);
         return res.status(500).json({message:"Internal Server Error"});
    }
}

export const checkAuth = async(req,res)=>{   
    try {
       return res.status(200).json(req.user);
    } catch (error) {
        console.log("error in checkAuth controller", error.message);
        return res.status(500).json({message:"Internal Server Error"});
    }
}