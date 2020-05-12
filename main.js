const client = contentful.createClient({
    // This is the space ID. A space is like a project folder in Contentful terms
    space: "huonygrkjbwy",
    // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "X_V45cqEv5adY5XTghrnxlFteK9LRdMYhkaN-dR1FkU"
});
// variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDom = document.querySelector(".products-center");

// carts
let cart = [];
// add buttons 
let buttonsDom = [];
// getting items
class Products {
    async getItems() {
        try {
            let contentful = await client.getEntries({
                content_type: 'comfyhouse'
            })
            let products = contentful.items;
            products = products.map(product => {
                const {
                    title,
                    price
                } = product.fields;

                const {
                    id
                } = product.sys;
                const image = product.fields.image.fields.file.url;
                return {
                    title,
                    price,
                    id,
                    image
                };
            });
            return products;
        } catch (error) {
            console.log(error);
        }
    }
}
// display products
class UI {
    outPutProducts(products) {
        let result = "";
        products.forEach(product => {
            result += `
    <article class="product">
        <div class="img-container">
            <img src=${product.image} alt="product" class="product-img"/>
            <button class ="bag-btn" data-id=${product.id}>
            <i class="fas fa-shopping-cart"></i>
            Add To Cart
            </button>
        </div>
        <h3>${product.title}</h3>
        <h4>$${product.price}</h4>
    </article>
            `;
        });
        productsDom.innerHTML = result;
    }
    getMyButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDom = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            let inCart = cart.find(item => item.id === id);
            if (inCart) {
                button.innerText = "In Cart";
                button.disabled = true;
            }
            button.addEventListener('click', (e) => {
                e.target.innerText = "In Cart";
                e.target.disabled = true;
                // get product form local storage
                let cartItem = {
                    ...Storage.getProduct(id),
                    amount: 1
                };
                // add to cart 
                cart.push(cartItem);
                // save itemS to local storage
                Storage.saveCart(cart);
                // set cart values
                this.setCartValues(cart);
                // add cartItem
                this.addCartItem(cartItem);
                // show the cart
                this.showCart();
            });

        });
    }
    setCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.amount * item.price;
            itemsTotal += item.amount;
        });
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    }
    addCartItem(item) {
        let div = document.createElement('div');
        div.classList.add('cart-item');
        div.innerHTML = `
                    <img src=${item.image} alt="product"/>
                    <div>
                        <h4>${item.title}</h4>
                        <h5>$${item.price}</h5>
                        <span class="remove-item" data-id=${item.id}>remove</span>
                    </div>
                    <div>
                        <i class="fas fa-chevron-up" data-id=${item.id}></i>
                        <p class="item-amount">${item.amount}</p>
                        <i class="fas fa-chevron-down" data-id=${item.id}></i>
                    </div>
        `;
        cartContent.appendChild(div);
    }
    showCart() {
        cartOverlay.classList.add('transparentBcg');
        cartDOM.classList.add('showCart');
    }
    hideCart() {
        cartOverlay.classList.remove('transparentBcg');
        cartDOM.classList.remove('showCart');
    }
    setupAPP() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        cart.forEach(item => {
            this.addCartItem(item);
        });
        cartBtn.addEventListener('click', this.showCart);
        closeCartBtn.addEventListener('click', this.hideCart);
    }
    cartLogic() {
        clearCartBtn.addEventListener('click', () => {
            this.clearCart();
        });
        // cart functionallty
        cartContent.addEventListener("click", (e) => {
            if (e.target.classList.contains("remove-item")) {
                let removeItem = e.target;
                let id = removeItem.dataset.id;
                this.removeItem(id);
                cartContent.removeChild(removeItem.parentElement.parentElement);
            } else if (e.target.classList.contains("fa-chevron-up")) {
                let amoutEle = e.target;
                let id = amoutEle.dataset.id;
                let spec = cart.find(item => item.id === id);
                spec.amount = spec.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                amoutEle.nextElementSibling.innerText = spec.amount;
            } else if (e.target.classList.contains("fa-chevron-down")) {
                let amoutEle = e.target;
                let id = amoutEle.dataset.id;
                let spec = cart.find(item => item.id === id);
                spec.amount = spec.amount - 1;
                if (spec.amount > 0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    amoutEle.previousElementSibling.innerText = spec.amount;
                } else {
                    cartContent.removeChild(amoutEle.parentElement.parentElement);
                    this.removeItem(id);
                }
            }
        });
    }
    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeItem(id));
        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0]);
        }
        this.hideCart();
    }
    removeItem(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getSingleButton(id);
        button.disabled = false;
        button.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
            Add To Cart
        `;
    }
    getSingleButton(id) {
        return buttonsDom.find(button => button.dataset.id === id);
    }
}

// deal with local storage
class Storage {

    // set all products to local storage
    static saveProduct(products) {
            localStorage.setItem('products', JSON.stringify(products));
        }
        // get products form local storage 
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem('products'));
        return products.find(item => item.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }
    static getCart() {
        return localStorage.getItem('cart') ? JSON.parse(localStorage.getItem('cart')) : [];
    }
}

// add products when dom content loaded and save it into local storage
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const products = new Products();
    ui.setupAPP();
    // getting all products 
    products.getItems().then(data => {
        ui.outPutProducts(data);
        Storage.saveProduct(data);
    }).then(() => {
        ui.getMyButtons();
        ui.cartLogic();
    });
});