// agents-config.js
// Configuration for all agents used in the application

const salesAgent = {
  type: 'sales',
  instructions: `You are Luxora a food service sales agent with the following responsibilities:
1. Help customers find the best meal for their needs
2. Always use the focus_menu_item tool to highlight specific menu items when:
   - talking about a menu item to the customer
   - Customer mentions a menu item 
3. CONSTANTLY use the order tool to update the customer's cart throughout the conversation:
   - When customer wants to add an item to their order
   - When customer wants to remove an item from their order
   - When customer wants to see their current order
   - When customer confirms they want to purchase
   - Keep the order updated in real-time as the conversation progresses

---
You can only sell:
- Big Burger Combo (Classic burger + fries + medium drink)  - $14.89 USD
- Double Cheeseburger (Two patties, American cheese)  - $5.79 USD
- Cheeseburger (Pickles, onions, ketchup, mustard)  - $3.49 USD
- Hamburger (Simple & classic)  - $2.99 USD
- Crispy Chicken Sandwich (Lettuce, mayo)  - $4.99 USD
- Chicken Nuggets (6 pc) (Choice of sauces)  - $4.49 USD
- Crispy Fish Sandwich (Tartar sauce, shredded lettuce)  - $5.29 USD
- Fries (Small/Medium/Large)  - $3.19 USD
- Baked Apple Pie (Warm handheld pie)  - $1.79 USD
- Manzana Postobon® Drink (Ice-cold, refreshing)  - $1.49 USD

The focus_menu_item tool controls an UI with pictures of the menu items. You will receive descriptions of the pictures the customer will see.
The order tool controls the cart display and order management. Use both tools constantly to provide the best experience.

IMPORTANT: Update the order tool frequently to keep the customer's cart visible and current throughout the conversation.`,
  tools: [
    {
      type: 'function',
      name: 'focus_menu_item',
      description: 'Focus on a specific menu item, when the user mentions it',
      parameters: {
        type: 'object',
        properties: {
          menu_item: {
            type: 'string',
            enum: [
              'Big Burger Combo',
              'Double Cheeseburger',
              'Cheeseburger',
              'Hamburger',
              'Crispy Chicken Sandwich',
              'Chicken Nuggets (6 pc)',
              'Crispy Fish Sandwich',
              'Fries',
              'Baked Apple Pie',
              'Manzana Postobon® Drink'
            ],
            description: 'The name of the menu item to focus on'
          }
        },
        required: ['menu_item']
      }
    },
    {
      type: 'function',
      name: 'order',
      description: 'Update the customer\'s order and manage the cart display. Use this tool constantly to keep the order updated throughout the conversation.',
      parameters: {
        type: 'object',
        properties: {
          cart: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                menu_item: {
                  type: 'string',
                  enum: [
                    'Big Burger Combo',
                    'Double Cheeseburger',
                    'Cheeseburger',
                    'Hamburger',
                    'Crispy Chicken Sandwich',
                    'Chicken Nuggets (6 pc)',
                    'Crispy Fish Sandwich',
                    'Fries',
                    'Baked Apple Pie',
                    'Manzana Postobon® Drink'
                  ],
                  description: 'The name of the menu item to purchase'
                },
                quantity: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Number of units'
                }
              },
              required: ['menu_item', 'quantity']
            },
            description: 'The cart items in the customer\'s order'
          },
          customer_confirm: {
            type: 'string',
            enum: ['yes', 'no', 'review'],
            description: 'Customer confirm the order to purchase'
          }
        },
        required: ['cart', 'customer_confirm']
      }
    }
  ],
  tool_choice: 'auto',
  temperature: 0.8
};

const paymentAgent = {
  type: 'payment',
  instructions: `You are Karol, a payments and delivery agent, with the following responsibilities:
1. Ask the customer to review and confirm the items in their cart (menu item names & quantities).
2. Remind the customer that delivery is always free and continuously update the order data.
3. Continuously update the order data while collect and validate:
   • Payment information (credit card number, expiration date, CVV)
   • Full name
   • Delivery address
   • Contact phone number
   • Email
4. If the customer says they're not sure which meal to buy at any point or want to see other menu items, transfer immediately call the transfer_to_menu_agent tool to hand off to a menu-specialist.
5. Once all required fields (cart, name, address, contact_phone, num) are provided by the customer and has confirmed by setting "confirm":"yes", call update_order_data one final time with all fields and "confirm":"yes", then thank the customer and conclude the session.

IMPORTANT: You can only work with the existing cart items. DO NOT add new menu items to the cart. If the customer wants to add items, transfer them back to the sales agent using transfer_to_menu_agent.

---
Use clear, polite language, validate inputs, allow the customer to correct mistakes, and rely only on these tools:
- update_order_data
- transfer_to_menu_agent

---
Constantly update the order data as much as possible.
Continuously update the order data as soon as the customer provides the information.
Use the update_order_data tool as much as possible`,
  tools: [
    {
      type: 'function',
      name: 'update_order_data',
      description: 'Update one or more fields of the customer\'s order (cart, contact info, payment info, order number) and always include confirmation.',
      parameters: {
        type: 'object',
        properties: {
          cart: {
            type: 'array',
            description: 'List of menu items and quantities in the customer\'s cart',
            items: {
              type: 'object',
              properties: {
                menu_item: {
                  type: 'string',
                  enum: [
                    'Big Burger Combo',
                    'Double Cheeseburger',
                    'Cheeseburger',
                    'Hamburger',
                    'Crispy Chicken Sandwich',
                    'Chicken Nuggets (6 pc)',
                    'Crispy Fish Sandwich',
                    'Fries',
                    'Baked Apple Pie',
                    'Manzana Postobon® Drink'
                  ],
                  description: 'Name of the menu item'
                },
                quantity: {
                  type: 'integer',
                  minimum: 1,
                  description: 'Number of units'
                }
              },
              required: ['menu_item', 'quantity']
            }
          },
          name: {
            type: 'string',
            description: "Customer's full name"
          },
          address: {
            type: 'string',
            description: 'Shipping address'
          },
          contact_phone: {
            type: 'string',
            description: 'Phone for shipping notifications'
          },
          credit_card_number: {
            type: 'string',
            description: "Customer's credit card number"
          },
          expiration_date: {
            type: 'string',
            description: 'Credit card expiration date (MM/YY)'
          },
          cvv: {
            type: 'string',
            description: 'Credit card CVV code (3 or 4 digits)'
          },
          confirm: {
            type: 'string',
            enum: ['yes', 'no'],
            description: 'Customer confirms everything is correct and wants to proceed with payment'
          }
        },
        required: ['confirm']
      }
    },
    {
      type: 'function',
      name: 'transfer_to_menu_agent',
      description: 'Transfer the conversation to a menu-specialist agent so they can help the customer choose which menu item to buy',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  ],
  tool_choice: 'auto',
  temperature: 0.8
};

module.exports = {
  salesAgent,
  paymentAgent
};
