import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import authService from "../../api/authService";
import { Colors } from "../../constants/theme";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

const SignupScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error: authError } = useAppSelector((state) => state.auth);

  const [firstname, setfirstname] = useState("");
  const [lastname, setlastname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<{
    firstname?: string;
    lastname?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  type RegisterField =
    | "firstname"
    | "lastname"
    | "email"
    | "phoneNumber"
    | "password"
    | "confirmPassword";

  const handleFieldChange = (field: RegisterField) => (text: string) => {
    if (field === "firstname") setfirstname(text);
    if (field === "lastname") setlastname(text);
    if (field === "email") setEmail(text);
    if (field === "phoneNumber") setPhoneNumber(text);
    if (field === "password") setPassword(text);
    if (field === "confirmPassword") setConfirmPassword(text);

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!firstname) {
      newErrors.firstname = "First name is required";
      isValid = false;
    } else if (firstname.length < 2) {
      newErrors.firstname = "Enter a valid first name";
      isValid = false;
    }

    if (!lastname) {
      newErrors.lastname = "Last name is required";
      isValid = false;
    } else if (lastname.length < 2) {
      newErrors.lastname = "Enter a valid last name";
      isValid = false;
    }

    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!phoneNumber) {
      newErrors.phoneNumber = "Phone number is required";
      isValid = false;
    } else if (!/^\+?[0-9]{7,15}$/.test(phoneNumber)) {
      newErrors.phoneNumber = "Enter a valid phone number";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = "Minimum 8 characters required";
      isValid = false;
    } else if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)
    ) {
      newErrors.password =
        "Must include uppercase, lowercase, number & special character";
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    const payload = {
      firstname,
      lastname,
      email,
      phoneNumber,
      password,
    };

    try {
      await dispatch(authService.register(payload));
      router.replace("/(user)");
    } catch {
      // error is surfaced through auth slice
    }
  };

  return (
    <LinearGradient colors={["#FEEDE6", "#FFFFFF"]} style={styles.gradient}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          {authError && <Text style={styles.authError}>{authError}</Text>}

          <TextInput
            placeholder="First Name"
            placeholderTextColor="#999"
            style={styles.input}
            value={firstname}
            onChangeText={handleFieldChange("firstname")}
            autoCapitalize="words"
          />
          {errors.firstname && (
            <Text style={styles.error}>{errors.firstname}</Text>
          )}

          <TextInput
            placeholder="Last Name"
            placeholderTextColor="#999"
            style={styles.input}
            value={lastname}
            onChangeText={handleFieldChange("lastname")}
            autoCapitalize="words"
          />
          {errors.lastname && (
            <Text style={styles.error}>{errors.lastname}</Text>
          )}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#999"
            style={styles.input}
            value={email}
            onChangeText={handleFieldChange("email")}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.error}>{errors.email}</Text>}

          <TextInput
            placeholder="Phone Number"
            placeholderTextColor="#999"
            style={styles.input}
            value={phoneNumber}
            onChangeText={handleFieldChange("phoneNumber")}
            keyboardType="phone-pad"
          />
          {errors.phoneNumber && (
            <Text style={styles.error}>{errors.phoneNumber}</Text>
          )}

          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            style={styles.input}
            value={password}
            onChangeText={handleFieldChange("password")}
          />
          {errors.password && (
            <Text style={styles.error}>{errors.password}</Text>
          )}

          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#999"
            secureTextEntry
            style={styles.input}
            value={confirmPassword}
            onChangeText={handleFieldChange("confirmPassword")}
          />
          {errors.confirmPassword && (
            <Text style={styles.error}>{errors.confirmPassword}</Text>
          )}

          <TouchableOpacity onPress={() => router.push("/#")}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              isLoading ? styles.buttonDisabled : undefined,
            ]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>
          <View style={styles.linewithtext}>
            <View style={styles.line} />
            <Text style={styles.text}>or</Text>
            <View style={styles.line} />
          </View>
          <Text style={styles.otherSignIn}>Sign in with</Text>
          <View style={styles.otherSignInicon}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: "#3b5998" }]}
            >
              <FontAwesome name="facebook-f" size={18} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: "#ff8c00" }]}
            >
              <MaterialIcons name="email" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.SignupBtn}>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={styles.signupTouch}
            >
              <AntDesign
                name="up"
                size={15}
                color="white"
                style={styles.upArrow}
              />
              <Text style={[styles.signup, { color: "white" }]}>
                Already have an account
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    paddingVertical: 20,
  },
  card: {
    padding: 25,
    borderRadius: 20,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: "center",
  },
  authError: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
  },
  input: {
    backgroundColor: Colors.default.white,
    borderRadius: 30,
    paddingHorizontal: 20,
    height: 40,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: Colors.default.gray,
  },
  button: {
    backgroundColor: Colors.default.primary,
    height: 40,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPassword: {
    textAlign: "right",
    textDecorationLine: "underline",
    fontSize: 13,
    fontWeight: "500",
  },
  error: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginLeft: 10,
  },
  signup: {
    flex: 1,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  linewithtext: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 30,
    marginRight: 30,
    marginTop: 10,
  },
  line: {
    flex: 1,
    height: 1.5,
    backgroundColor: Colors.default.primary,
  },
  text: {
    fontSize: 16,
    color: "black",
    marginBottom: 5,
  },
  otherSignIn: {
    color: Colors.default.primary,
    textAlign: "center",
    fontSize: 14,
    marginTop: 8,
  },
  otherSignInicon: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginTop: 7,
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  SignupBtn: {
    alignItems: "center",
    marginTop: 20,
  },
  signupTouch: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.default.primary,
    borderRadius: 30,
    paddingTop: 10,
    paddingBottom: 10,
  },
  upArrow: {
    marginTop: 5,
  },
});
