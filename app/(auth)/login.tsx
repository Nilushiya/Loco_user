import { AntDesign, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "../../api/authService";
import { Colors } from "../../constants/theme";
import { TRAIN_DETAILS_KEY, TRAIN_DETAILS_TTL_MS } from "../../constants/train";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";

const LoginScreen = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isLoading, error: authError } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    let isValid = true;

    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const ensureTrainDetailsMissing = async () => {
    try {
      const raw = await AsyncStorage.getItem(TRAIN_DETAILS_KEY);
      if (!raw) return true;

      const parsed = JSON.parse(raw);
      return !(
        parsed?.savedAt && Date.now() - parsed.savedAt < TRAIN_DETAILS_TTL_MS
      );
    } catch {
      return true;
    }
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await dispatch(authService.login({ email, password }));
      await AsyncStorage.setItem("userEmail", email);
      const needsDetails = await ensureTrainDetailsMissing();
      if (needsDetails) {
        router.replace("/form/train-details");
        return;
      }
      router.replace("/(user)");
    } catch {
      // error message is managed by Redux state, so nothing more is required here
    }
  };

  return (
    <LinearGradient colors={["#FEEDE6", "#FFFFFF"]} style={styles.gradient}>
      <View style={styles.card}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {authError && <Text style={styles.authError}>{authError}</Text>}

        <TextInput
          placeholder="Email"
          placeholderTextColor="#999"
          style={styles.input}
          value={email}
          onChangeText={handleEmailChange}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email && <Text style={styles.error}>{errors.email}</Text>}

        <TextInput
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={handlePasswordChange}
        />
        {errors.password && <Text style={styles.error}>{errors.password}</Text>}

        <TouchableOpacity onPress={() => router.push("/#")}>
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            isLoading ? styles.buttonDisabled : undefined,
          ]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
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

          {/* Email Login */}
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: "#ff8c00" }]}
          >
            <MaterialIcons name="email" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.SignupBtn}>
        <TouchableOpacity
          onPress={() => router.push("/signup")}
          style={styles.signupTouch}
        >
          <AntDesign
            name="up"
            size={15}
            color="white"
            style={styles.upArrow}
          />
          <Text style={[styles.signup, { color: "white" }]}>Sign Up</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    backgroundColor: Colors.default.background,
  },
  gradient: {
    flex: 1,
  },
  card: {
    flex: 1,
    padding: 25,
    borderRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: Colors.default.primary,
  },
  logo: {
    width: 200,
    height: 200,
    alignSelf: "center",
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
  link: {
    textAlign: "center",
    marginTop: 15,
    color: Colors.default.primary,
    fontWeight: "500",
  },
  error: {
    color: "red",
    fontSize: 12,
    marginTop: -10,
    marginLeft: 10,
  },
  authError: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 5,
  },
  linewithtext: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 30,
    marginRight: 30,
    marginTop: 20,
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
  },
  signupTouch: {
    width: "100%",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.default.primary,
    borderRadius: 30,
    paddingTop: 10,
  },
  upArrow: {
    flex: 1,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 5,
  },
  signup: {
    flex: 1,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
});
