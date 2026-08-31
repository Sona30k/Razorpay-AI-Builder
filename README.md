# TechAtlas AI

TechAtlas AI is a 3D, AI-native map of India's technology ecosystem where users can discover companies, explore products, receive AI recommendations, approve purchases, and complete payments through Razorpay Test Mode.

The project combines geospatial company discovery, AI-assisted commerce, merchant growth intelligence, and auditable payment workflows into one connected demo experience.

## Core Idea

Most company directories treat businesses as static database entries. TechAtlas AI places companies at their real-world locations on a 3D representation of Indian cities, allowing users to explore the Indian technology ecosystem geographically.

Users can move through:

```text
India -> City -> Technology cluster -> Building -> Company -> Product -> Transaction
```

An AI agent sits on top of this map and helps users discover, compare, and purchase relevant products or services.

## Demo Scenario

The main demo can follow this user journey:

```text
User: "I am a startup founder in Bengaluru looking for an HR product under Rs.10,000."

AI Buyer
  -> Understands the requirement
  -> Searches the company and product catalog
  -> Compares available options
  -> Explains the recommendation
  -> Shows the company on the 3D map
  -> Requests explicit user approval
  -> Starts Razorpay Test Mode payment
  -> Handles success or failure
  -> Records the full audit trail
```

## Product Pillars

### 1. 3D Tech Ecosystem Map

The map is the visual core of the product.

Users can explore Indian technology hubs geographically and inspect companies based on city, cluster, building, category, and product offering.

Example:

```text
India
  -> Bengaluru
  -> Koramangala
  -> TechStore Demo
  -> Product Catalog
```

### 2. AI Buyer Agent

The AI Buyer Agent helps users find suitable products based on natural language needs.

Example:

```text
User: "I need something for my work-from-home setup under Rs.5,000."
```

The agent can:

- Understand user requirements
- Search the product catalog
- Compare products
- Check budget constraints
- Recommend suitable items
- Explain why the recommendation fits
- Ask for user approval before payment

### 3. Simulated Merchant Store

The project includes a small demo merchant storefront called **TechStore Demo**.

Sample products:

| Product | Price |
| --- | ---: |
| Laptop Stand | Rs.2,499 |
| Mechanical Keyboard | Rs.3,499 |
| Wireless Mouse | Rs.1,499 |
| Monitor | Rs.12,999 |
| USB-C Hub | Rs.2,999 |
| Webcam | Rs.4,999 |

Each product should contain:

- Product ID
- Name
- Description
- Price
- Category
- Features
- Stock
- Complementary products
- Target customer

This merchant is not separate from the map. It should be discoverable as a company inside TechAtlas AI.

### 4. Commerce Flow

The commerce journey follows:

```text
Understand -> Discover -> Compare -> Recommend -> Approve -> Pay
```

The AI can recommend products, build a cart, and prepare a purchase request. However, it must never charge the user automatically.

Every payment action must follow:

```text
AI recommendation
  -> Show amount
  -> Explain reason
  -> Check spending limit
  -> User approval
  -> Razorpay Test Mode checkout
```

### 5. Razorpay Test Payment

The payment flow should use Razorpay Test Mode.

Important payment rules:

- Razorpay credentials must stay on the backend.
- The backend creates Razorpay orders.
- The backend verifies payments before marking orders as paid.
- The frontend should never expose secret keys.
- Failed payments should trigger recovery options.

### 6. AI Growth Agent for Merchants

TechAtlas AI also includes a merchant-side AI Growth Agent.

The agent analyzes sample merchant data such as:

- Revenue
- Orders
- Conversion rate
- Average order value
- Product views
- Purchase patterns
- Cart behavior
- Product combinations

It can identify:

- Upsell opportunities
- Cross-sell opportunities
- Product improvement opportunities
- Campaign opportunities

Example:

```text
Laptop Stand -> Mechanical Keyboard

38% of customers purchasing the stand also purchase the keyboard.
Recommendation: Add keyboard recommendation at checkout.
```

The merchant must approve growth actions before execution.

### 7. Audit Trail

Because the system participates in commerce, every major AI and payment step should be auditable.

Example audit log:

```text
12:31:02 User requested WFH products.
12:31:04 AI searched product catalog.
12:31:05 Found matching products.
12:31:06 AI selected Laptop Stand.
12:31:08 AI suggested Mechanical Keyboard.
12:31:10 User approved purchase.
12:31:11 Razorpay order created.
12:31:20 Payment failed.
12:31:24 AI offered retry.
12:31:30 User approved retry.
12:31:42 Payment successful.
```

## Major Screens

### Explore

The 3D India map where users discover cities, clusters, buildings, companies, and products.

### AI Assistant

A conversational interface where users describe what they need and receive AI-powered product recommendations.

### Commerce

Product detail, cart, AI purchase request, approval gate, Razorpay checkout, and payment result.

### Merchant Growth

A merchant dashboard showing business metrics and AI-generated revenue opportunities.

### AI Activity

An audit log showing the full decision and transaction history.

## Trust and Control Model

TechAtlas AI should be:

- **Explainable:** The AI explains every recommendation and important action.
- **Bounded:** The AI operates within spending limits and predefined rules.
- **Gated:** Financial actions require explicit approval.
- **Auditable:** User requests, AI reasoning, approvals, payments, and results are recorded.
- **Recoverable:** Failed transactions can be retried only after user approval.

## Recommended Tech Stack

### Frontend

- Next.js or React
- Three.js
- Tailwind CSS

### Backend

- Node.js with Express, or Python with FastAPI

### Database

- PostgreSQL

### Geospatial

- OpenStreetMap
- GeoJSON
- Geocoding

### Payments

- Razorpay Test Mode

### AI

- LLM-based agent
- Tool calling for catalog search, cart actions, payment preparation, and audit logging

## MVP Data

The demo can use synthetic data:

- 50-100 sample companies
- 20-50 sample products
- Sample customers
- Sample transactions
- Sample merchant analytics
- Razorpay test orders and payments

The data can be fake, but the workflow should feel real.

## Final Vision

TechAtlas AI connects physical company discovery with AI-native commerce.

```text
India Tech Ecosystem
  -> 3D City Map
  -> Company Discovery
  -> AI Buyer Agent
  -> AI Growth Agent
  -> User or Merchant Approval
  -> Razorpay Payment
  -> Completed Transaction
  -> Audit Trail
```

In one sentence:

**TechAtlas AI is a 3D, AI-native map of India's technology ecosystem where intelligent agents help users discover and purchase products from companies while helping merchants identify and execute opportunities to grow revenue.**
