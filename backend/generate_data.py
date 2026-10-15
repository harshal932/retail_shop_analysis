"""
Realistic Synthetic Retail Sales Data Generator for DWDM Mini Project
Generates clean retail transaction data matching BI requirements and a dirty sample for ETL demo.
"""
import os
import random
import pandas as pd
from datetime import datetime, timedelta

def generate_datasets(output_dir="data", num_records=12893):
    os.makedirs(output_dir, exist_ok=True)
    random.seed(42)

    categories = {
        "Electronics": [
            ("iPhone 15", 79900, "Apple"),
            ("Samsung Galaxy Watch", 24999, "Samsung"),
            ("Sony WH-1000XM5 Headphones", 29990, "Sony"),
            ("Dell XPS 13 Laptop", 115000, "Dell"),
            ("iPad Air 5th Gen", 54900, "Apple"),
            ("Boat Airdopes 141", 1299, "Boat"),
            ("OnePlus Nord CE 3", 19999, "OnePlus")
        ],
        "Fashion": [
            ("Men's T-Shirt", 899, "Levi's"),
            ("Women's Slim Fit Jeans", 2499, "Zara"),
            ("Cotton Casual Shirt", 1499, "Allen Solly"),
            ("Floral Summer Dress", 1999, "H&M"),
            ("Formal Leather Shoes", 3499, "Clarks"),
            ("Sports Track Pants", 1299, "Nike")
        ],
        "Sports & Outdoors": [
            ("Nike Running Shoes", 5499, "Nike"),
            ("Adidas Gym Backpack", 2299, "Adidas"),
            ("Yoga Mat Non-Slip", 899, "Boldfit"),
            ("Badminton Racket Set", 1799, "Yonex"),
            ("Cricket Leather Ball Pack", 999, "SG")
        ],
        "Home & Living": [
            ("Air Fryer 4L", 5999, "Philips"),
            ("Cotton King Bedsheet", 1299, "Bombay Dyeing"),
            ("Stainless Steel Cookware Set", 3499, "Prestige"),
            ("Electric Kettle 1.5L", 1199, "Pigeon"),
            ("Aromatherapy Diffuser", 1499, "Solimo")
        ],
        "Beauty & Health": [
            ("Vitamin C Face Serum", 699, "Minimalist"),
            ("Sunscreen SPF 50", 499, "Derma Co"),
            ("Hydrating Moisturizer", 599, "Cetaphil"),
            ("Electric Toothbrush", 1599, "Oral-B"),
            ("Whey Protein 1kg", 2499, "MuscleBlaze")
        ],
        "Toys & Games": [
            ("Lego City Building Set", 2499, "Lego"),
            ("Board Game Monopoly Deluxe", 1299, "Hasbro"),
            ("Remote Control Car", 1499, "Hot Wheels"),
            ("Wooden Educational Puzzle", 599, "Skillmatics")
        ]
    }

    stores = [
        {"store_id": "STR_01", "name": "Pune Phoenix Mall", "city": "Pune", "region": "West", "weight": 0.23},
        {"store_id": "STR_02", "name": "Mumbai High Street Phoenix", "city": "Mumbai", "region": "West", "weight": 0.20},
        {"store_id": "STR_03", "name": "Bengaluru Forum Koramangala", "city": "Bengaluru", "region": "South", "weight": 0.18},
        {"store_id": "STR_04", "name": "Delhi Select Citywalk", "city": "Delhi", "region": "North", "weight": 0.16},
        {"store_id": "STR_05", "name": "Hyderabad Inorbit Mall", "city": "Hyderabad", "region": "South", "weight": 0.13},
        {"store_id": "STR_06", "name": "Kolkata South City Mall", "city": "Kolkata", "region": "East", "weight": 0.06},
        {"store_id": "STR_07", "name": "Bhopal DB City Mall", "city": "Bhopal", "region": "Central", "weight": 0.04}
    ]

    channels = [
        {"name": "In-Store", "weight": 0.42},
        {"name": "Online", "weight": 0.35},
        {"name": "Mobile App", "weight": 0.23}
    ]

    payment_methods = [
        {"method": "UPI", "weight": 0.46},
        {"method": "Credit Card", "weight": 0.25},
        {"method": "Debit Card", "weight": 0.15},
        {"method": "Net Banking", "weight": 0.08},
        {"method": "Cash on Delivery", "weight": 0.06}
    ]

    first_names = ["Rohit", "Sneha", "Amit", "Pooja", "Karan", "Ananya", "Vikram", "Neha", "Rahul", "Priya", "Arjun", "Deepika", "Aditya", "Ritu", "Suresh", "Meera", "Varun", "Sunita"]
    last_names = ["Sharma", "Patil", "Kumar", "Singh", "Mehta", "Verma", "Joshi", "Deshmukh", "Nair", "Iyer", "Rao", "Gupta", "Agarwal", "Reddy", "Choudhury", "Shah"]

    customers = []
    for i in range(1, 1501):
        fn = random.choice(first_names)
        ln = random.choice(last_names)
        gender = "Female" if fn in ["Sneha", "Pooja", "Ananya", "Neha", "Priya", "Deepika", "Ritu", "Meera", "Sunita"] else "Male"
        customers.append({
            "customer_id": f"CUST_{i:04d}",
            "customer_name": f"{fn} {ln}",
            "gender": gender,
            "age": random.randint(18, 65),
            "email": f"{fn.lower()}.{ln.lower()}{random.randint(1,99)}@example.com",
            "city": random.choice(["Pune", "Mumbai", "Bengaluru", "Delhi", "Hyderabad", "Kolkata", "Bhopal", "Chennai"])
        })

    # Generate dates across 2025
    start_date = datetime(2025, 1, 1, 9, 0, 0)
    end_date = datetime(2025, 12, 31, 21, 0, 0)
    total_seconds = int((end_date - start_date).total_seconds())

    store_choices = [s for s in stores]
    store_weights = [s["weight"] for s in stores]
    channel_choices = [c["name"] for c in channels]
    channel_weights = [c["weight"] for c in channels]
    payment_choices = [p["method"] for p in payment_methods]
    payment_weights = [p["weight"] for p in payment_methods]

    category_list = list(categories.keys())
    # Category distribution
    cat_weights = [0.32, 0.22, 0.16, 0.14, 0.10, 0.06]

    clean_records = []
    for i in range(1, num_records + 1):
        # Distribute more transactions towards festival/Q4 months (Oct-Dec)
        random_fraction = random.random()
        if random_fraction < 0.40:
            # Q4 festival boost (Diwali, New Year)
            q4_start = datetime(2025, 10, 1, 9, 0, 0)
            q4_sec = int((end_date - q4_start).total_seconds())
            tx_dt = q4_start + timedelta(seconds=random.randint(0, q4_sec))
        else:
            tx_dt = start_date + timedelta(seconds=random.randint(0, total_seconds))

        cust = random.choice(customers)
        store = random.choices(store_choices, weights=store_weights, k=1)[0]
        channel = random.choices(channel_choices, weights=channel_weights, k=1)[0]
        payment = random.choices(payment_choices, weights=payment_weights, k=1)[0]

        cat = random.choices(category_list, weights=cat_weights, k=1)[0]
        prod_tuple = random.choice(categories[cat])
        prod_name, unit_price, brand = prod_tuple

        quantity = random.choices([1, 2, 3, 4, 5], weights=[0.68, 0.20, 0.08, 0.03, 0.01], k=1)[0]
        gross_amount = round(unit_price * quantity, 2)
        
        # Discount logic
        has_discount = random.random() < 0.45
        discount_rate = round(random.choice([0.05, 0.10, 0.15, 0.20, 0.25]), 2) if has_discount else 0.0
        discount_amount = round(gross_amount * discount_rate, 2)
        net_amount = round(gross_amount - discount_amount, 2)
        tax_amount = round(net_amount * 0.18, 2) # 18% GST

        clean_records.append({
            "transaction_id": f"TXN_{i:06d}",
            "transaction_date": tx_dt.strftime("%Y-%m-%d %H:%M:%S"),
            "customer_id": cust["customer_id"],
            "customer_name": cust["customer_name"],
            "customer_email": cust["email"],
            "product_name": prod_name,
            "product_category": cat,
            "brand": brand,
            "unit_price": unit_price,
            "quantity": quantity,
            "gross_amount": gross_amount,
            "discount_amount": discount_amount,
            "net_amount": net_amount,
            "tax_amount": tax_amount,
            "payment_method": payment,
            "channel": channel,
            "store_id": store["store_id"],
            "store_name": store["name"],
            "store_city": store["city"],
            "store_region": store["region"]
        })

    # Sort chronologically
    clean_records.sort(key=lambda x: x["transaction_date"])
    df_clean = pd.DataFrame(clean_records)
    clean_path = os.path.join(output_dir, "retail_sales_clean.csv")
    df_clean.to_csv(clean_path, index=False)
    print(f"Generated {len(df_clean)} clean records -> {clean_path}")

    # Generate a dirty sample dataset for demonstrating ETL validation and error logging
    dirty_records = []
    # Take first 500 records from clean
    for idx, row in enumerate(clean_records[:500]):
        item = dict(row)
        # Introduce deliberate errors
        if idx % 40 == 0:
            # Duplicate transaction ID
            item["transaction_id"] = "TXN_000001"
        elif idx % 45 == 1:
            # Missing product name
            item["product_name"] = ""
        elif idx % 50 == 2:
            # Negative quantity
            item["quantity"] = -2
            item["gross_amount"] = -1000
        elif idx % 55 == 3:
            # Invalid date format
            item["transaction_date"] = "15/12/2025 INVALID"
        elif idx % 60 == 4:
            # Missing customer name and email
            item["customer_name"] = None
            item["customer_email"] = "not-an-email"
        elif idx % 70 == 5:
            # Negative discount amount
            item["discount_amount"] = -500
        dirty_records.append(item)

    df_dirty = pd.DataFrame(dirty_records)
    dirty_path = os.path.join(output_dir, "retail_sales_dirty_sample.csv")
    df_dirty.to_csv(dirty_path, index=False)
    print(f"Generated {len(df_dirty)} dirty sample records -> {dirty_path}")

    return clean_path, dirty_path

if __name__ == "__main__":
    generate_datasets()
