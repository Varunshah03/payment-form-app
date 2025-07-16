import { useState } from 'react';
import './App.css';

function App() {
  const [amount, setAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('');
  const [tip, setTip] = useState(0);
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
    anonymous: false,
  });
  const [errors, setErrors] = useState({});

  const contributionOptions = [1000, 2500, 4000];
  const tipOptions = [0, 5, 10, 18];

  const validateForm = () => {
    const newErrors = {};
    if (!form.name) newErrors.name = 'Name is required';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid email is required';
    if (!form.mobile || !/^\d{10}$/.test(form.mobile)) newErrors.mobile = 'Valid 10-digit mobile number is required';
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

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(calculateTotal()),
          currency: 'INR',
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: data.name,
        order_id: data.orderId,
        handler: function (response) {
          alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`);
        },
        prefill: {
          name: form.anonymous ? '' : form.name,
          email: form.anonymous ? '' : form.email,
          contact: form.anonymous ? '' : form.mobile,
        },
        theme: { color: '#3399cc' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Failed to create order');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Contribution Form</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Contribution Amount (₹)</label>
        <div className="flex gap-2 mb-2">
          {contributionOptions.map((opt) => (
            <button
              key={opt}
              className={`flex-1 p-2 border rounded ${amount === opt && !customAmount ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'} hover:bg-blue-600 hover:text-white transition duration-200`}
              onClick={() => {
                setAmount(opt);
                setCustomAmount('');
              }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <text x="0" y="15" fontSize="15">₹</text>
              </svg>
              {opt}
            </button>
          ))}
        </div>
        <input
          type="number"
          placeholder="Enter other amount"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Tip (%)</label>
        <select
          value={tip}
          onChange={(e) => setTip(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {tipOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}%
            </option>
          ))}
        </select>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={`w-full p-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={`w-full p-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number *</label>
        <input
          type="text"
          value={form.mobile}
          onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          className={`w-full p-2 border ${errors.mobile ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 ${errors.mobile ? 'focus:ring-red-500' : 'focus:ring-blue-500'}`}
        />
        {errors.mobile && <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>}
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={form.anonymous}
            onChange={(e) => setForm({ ...form, anonymous: e.target.checked })}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Make my contribution anonymous</span>
        </label>
      </div>
      <div className="mb-6">
        <p className="text-lg font-semibold text-gray-800">Total: ₹{calculateTotal()}</p>
      </div>
      <button
        onClick={handleSubmit}
        className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
      >
        Proceed to Contribute ₹{calculateTotal()}
      </button>
    </div>
  );
}

export default App;