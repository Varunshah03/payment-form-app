import { useState, useEffect } from "react";
import bgImage from "./assets/360_F_652225930_sbWHvu8GlyCrcGwTweBdEAlf8xor5VXL.jpg";

function App() {
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [tip, setTip] = useState(0);
  const [form, setForm] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    anonymous: false,
  });
  const [errors, setErrors] = useState({});

  const contributionOptions = [1000, 2500, 4000];
  const tipOptions = [0, 5, 10, 18];

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = "Field Required";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Field Required";
    if (!form.mobile || !/^\d{10}$/.test(form.mobile))
      newErrors.mobile = "Please enter a valid number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotal = () => {
    const baseAmount = customAmount ? parseFloat(customAmount) : amount;
    const tipAmount = baseAmount * (tip / 100);
    return (baseAmount + tipAmount).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Wait for Razorpay script to be loaded
    if (!window.Razorpay) {
      alert(
        "Payment gateway is still loading. Please wait a moment and try again."
      );
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/create-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(calculateTotal()),
            currency: "INR",
          }),
        }
      );
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        order_id: data.orderId,
        handler: function (response) {
          alert(
            `Payment successful! Payment ID: ${response.razorpay_payment_id}`
          );
          window.location.reload(); // Reload the page after successful payment
        },
        prefill: {
          name: form.anonymous ? "" : form.name,
          email: form.anonymous ? "" : form.email,
          contact: form.anonymous ? "" : form.mobile,
        },
        theme: { color: "#3399cc" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        willChange: "transform",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div
        className="max-w-md w-full sm:w-11/12 xs:w-11/12 p-6 bg-white bg-opacity-90 shadow-md rounded-lg mx-4"
        style={{
          maxHeight: "90vh",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          backgroundClip: "padding-box",
        }}
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Choose a contribution amount
        </h1>
        <p className="text-sm text-gray-600 text-center mb-4">
          Most Contributors contribute approx ₹2500 to this Fundraiser
        </p>
        <div className="flex gap-2 mb-4 justify-center flex-wrap">
          {contributionOptions.map((opt) => (
            <button
              key={opt}
              className={`p-2 border rounded ${
                amount === opt && !customAmount
                  ? "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-700"
              } hover:bg-teal-600 hover:text-white transition duration-200 min-w-[80px] text-center`}
              onClick={() => {
                setAmount(opt);
                setCustomAmount("");
              }}
            >
              ₹{opt}
            </button>
          ))}
          <button
            className={`p-2 border rounded ${
              customAmount
                ? "bg-teal-500 text-white"
                : "bg-gray-100 text-gray-700"
            } hover:bg-teal-600 hover:text-white transition duration-200 min-w-[80px] text-center`}
            onClick={() => setCustomAmount("")}
          >
            Other Amount
          </button>
        </div>
        <input
          type="number"
          placeholder="Enter other amount"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mb-6 mt-4 p-3 bg-green-50 rounded-lg text-sm text-gray-700">
          Ketto is charging 0% platform fee* for this fundraiser, relying solely
          on the generosity of contributors like you.{" "}
          <span className="text-blue-600 cursor-pointer">ℹ️</span>
          <div className="mt-2">
            Support us by adding a tip of:{" "}
            <select
              value={tip}
              onChange={(e) => setTip(parseInt(e.target.value))}
              className="custom-select p-2 border border-teal-400 rounded-lg bg-white bg-opacity-80 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-400 transition duration-200 shadow-sm"
              style={{
                minWidth: "90px",
                marginLeft: "0.5rem",
                marginRight: "0.5rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
            >
              {tipOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}% (₹
                  {(customAmount ? parseFloat(customAmount) : amount) *
                    (opt / 100)}
                  )
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 font-semibold">
            Total Amount: INR {calculateTotal()}
          </p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full p-2 border ${
                errors.name ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.name ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            <span className="absolute right-3 top-2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-4 0-7 2-7 4v2h14v-2c0-2-3-4-7-4z" />
              </svg>
            </span>
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email ID <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full p-2 border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.email ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            <span className="absolute right-3 top-2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </span>
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {" "}
            <span className="text-green-600">🇮🇳</span> Your Mobile Number{" "}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.mobile}
              onChange={(e) => setForm({ ...form, mobile: e.target.value })}
              className={`w-full p-2 border ${
                errors.mobile ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 ${
                errors.mobile ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            <span className="absolute right-3 top-2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.773-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </span>
          </div>
          {errors.mobile && (
            <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address
          </label>
          <div className="relative">
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-400">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M10 2C6.13 2 3 5.13 3 9c0 5.25 7 9 7 9s7-3.75 7-9c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 10 6a2.5 2.5 0 0 1 0 5.5z" />
              </svg>
            </span>
          </div>
        </div>
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={form.anonymous}
              onChange={(e) =>
                setForm({ ...form, anonymous: e.target.checked })
              }
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">
              Make my contribution anonymous
            </span>
          </label>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full p-3 bg-teal-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 flex items-center justify-center"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <text x="0" y="15" fontSize="15"></text>
          </svg>
          Proceed To Contribute ₹{calculateTotal()}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default App;
