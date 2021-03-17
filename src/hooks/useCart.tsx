import { createContext, ReactNode, useContext, useState } from 'react'
import { toast } from 'react-toastify'
import { ProductList } from '../pages/Home/styles'
import { api } from '../services/api'
import { Product, Stock } from '../types'

interface CartProviderProps {
	children: ReactNode
}

interface UpdateProductAmount {
	productId: number
	amount: number
}

interface CartContextData {
	cart: Product[]
	addProduct: (productId: number) => Promise<void>
	removeProduct: (productId: number) => void
	updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void
}

const CartContext = createContext<CartContextData>({} as CartContextData)

export function CartProvider({ children }: CartProviderProps): JSX.Element {
	const [cart, setCart] = useState<Product[]>(() => {
		const storagedCart = localStorage.getItem('@RocketShoes:cart')

		if (storagedCart) {
			return JSON.parse(storagedCart)
		}

		return []
	})

	const addProduct = async (productId: number) => {
		try {
			// TODO
			const productOnCart = cart.find((product) => product.id === productId)

			if (productOnCart) {
				updateProductAmount({ productId: productOnCart.id, amount: productOnCart.amount + 1 })
			} else {
				const { data: newProduct } = await api.get<Product>(`/products/${productId}`)
				if (newProduct) {
					newProduct.amount = 1
					setCart([...cart, newProduct])
					localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, newProduct]))
				}
			}
		} catch {
			toast.error('Erro na adição do produto')
		}
	}

	const removeProduct = (productId: number) => {
		try {
			// TODO
			const newCart = cart.filter((product) => product.id !== productId)
			setCart(newCart)
			localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
		} catch {
			toast.error('Erro na remoção do produto')
		}
	}

	const updateProductAmount = async ({ productId, amount }: UpdateProductAmount) => {
		try {
			// TODO
			if (amount <= 0) throw new Error('Erro na alteração de quantidade do produto')

			const { data: stock } = await api.get<Stock>(`stock/${productId}`).catch(() => {
				throw new Error('Erro na alteração de quantidade do produto')
			})

			if (stock.amount < amount) {
				throw new Error('Quantidade solicitada fora de estoque')
			}

			const updatedCart = cart.map((product) => {
				if (product.id === productId) {
					product.amount = amount
				}
				return product
			})

			setCart(updatedCart)
			localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))
		} catch {
			toast.error('Erro na alteração de quantidade do produto')
		}
	}

	return (
		<CartContext.Provider value={{ cart, addProduct, removeProduct, updateProductAmount }}>
			{children}
		</CartContext.Provider>
	)
}

export function useCart(): CartContextData {
	const context = useContext(CartContext)

	return context
}
