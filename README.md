# stupid-array-forth
[online repl](https://garklein.github.io/stupid-array-forth/html/index.html)  
To run with Node: `npm install`, `npm stupid-array-forth.js`.  
This is the result of my attempt to cross-breed APL and Forth.  
This documentation will be a lot more useful if you are familiar with Forth, or another stack-based language. If you aren't, you should go learn one first.

## The Stack
Arrays are stored on the stack as `a1 a2 ... aN N`. Everything is an array, so scalars are stored on the stack as `x 1`.

## Stranding
Numbers from the input will be grouped into arrays until a function is hit, or the end of input. `,` is a no op word that is used for breaking up strands.

## Why it is so stupid (aka problems)
- The stack gets polluted with tons of stuff that _you_ don't need, but the computer does.
- Scalar operations feels clunky. You need to do `2 , 3 +` instead of the normal `2 3 +`.
- No good way to do multidimentional arrays. I supposed you could store them by putting another dimension on the stack, but this pollutes the stack even more. This also means that words like `iota` are unwieldy. If you write `1 2 iota`, now there are 2 arrays on the stack. If you want to drop all of them, you need to store the length of the original array (like `1 2 len swap iota`), and then use the horrible control flow to try to loop `drop` twice. If you want to operate on all the arrays you created with `iota`, you're out of luck (also see next point).
- No good way to do operators. Actually, I lied. Execution tokens, and using braces for composition is a really cool aspect of concatenative languages, but I was too lazy to implement them.

## Words
The words in the following sections might be described with stack comments, if it's appropriate. `a1 a2 ... aN N` represents an array, `A` is a shorthand for that, and `S` represents a scalar (aka an array in the form `x 1`). If a function takes a scalar, and you provide a longer array, it will just use the first element of the array. 0-length arrays will probably break something, and aren't consistent (`iota` and `dropa`).

### Comments
Anything between `(` and `)` will be a comment. They can be nested. This is pretty dumb since this is only a repl.

### Stack operations
#### `c` ( literally anything -- )
Clears the stack.
#### `,` ( -- )
No op. Used to break up stranding as described above.
#### `len` ( a1 a2 ... aN N -- a1 a2 ... aN N N 1 )
Pushes the length of the top array onto the stack.
#### `.s`
Prints the stack, formatted. Arrays are grouped, and the length indicators are prefixed with `A`.
#### `s`
Prints the stack, unformatted.
#### `dup` ( A -- A A )
#### `drop` ( A -- )
#### `swap` ( A1 A2 -- A2 A1 )
#### `rot` ( A1 A2 A3 -- A2 A3 A1 )
#### `d` and `p`
These are spicy. They will also break `.s` and might crash the program (this is what `s` is for).
`d` consumes the top array from the stack, and pushes it _without_ the length indicator.  
`p` consumes the top array from the stack, treats it as a scalar, and drops that many elements from the stack (_elements_, not _arrays_).

### Basic math operations
`sign`, `max`, `min`, `floor`, `ceil`, `+`, `-`, `*`, `/`, `**`, and `sqrt` do what you'd expect. They also map to arrays as they would in APL. For example, `2 3 4 , 2 +` is scalar/array addition, and `3 , 4 +` is scalar/scalar addition.

### Bitwise operations
`>>>`, `<<`, `>>`, `and`, `xor`, and `or` do what you'd expect. `not` makes `0` into `1`, and everything else into `0` (non bitwise, but I'm not making another section for it). They also all map.

### Comparison operations
`=`, `<`, `>`, `=>`, and `=<` return booleans and map like APL. `m=` is like APL's `match` and returns a scalar boolean indicating whether 2 arrays are identical or not (you can also think of it as an `and` fold of `=`).

### APL operations
#### `rev` ( a1 a2 ... aN N -- aN aN-1 ... a1 N )
Reverses an array.
#### `cat` ( a1 a2 ... aN N b1 b2 ... bM M -- a1 a2 ... aN b1 b2 ... bM N+M )
Catenates 2 arrays.
#### `iota`
Consumes the top array on the stack, and for each element, pushes onto the stack an array of `0 .. x-1`.
#### `take` ( A S -- B )
Consumes a scalar `S`, then an array `A`. Returns an array that is the result of taking the first `S` elements from A. If `S` is negative, it takes from the end. If `S` is bigger than the length of `A`, it will fill with 0s.
#### `dropa` ( A S -- B? )
Read the above word, but replace `take` and `taking` with `drop` and `dropping`. If `S` is bigger than the length of `A`, it doesn't push anything to the stack (and just acts like `drop`).

### Memory operations, and variables
#### `alloc` ( S -- addr )
Allocates `S` cells of memory, and returns the address of the last one.
#### `free` ( S -- )
Deallocates `S` cells of memory (idk why you'd want to though).
#### `!` ( a1 a2 ... aN N addr -- )
Stores the array `a` into memory where `N` is at `addr`, `aN` at `addr-1` etc.
#### `@` ( addr -- A )
Retrives the array at `addr`.
#### `f!` ( A N addr -- )
Fun `!`. Pops `addr` and `N` from the stack. Pops an _element_ off the stack N times and stores it at `addr-x`, where `x` is the number of completed pops.
#### `f@` ( N addr -- )
Fun `@`. Pushes cells from `addr-n+1` .. `addr` onto the stack.
#### `dump`
Displays the contents of memory.
#### Variables
If you have a number on the stack, you can make it a variable like this:  
`len 1 + alloc dup rot rot ! : myVar $s ;`  
You can retrieve the variable by inputting `myVar @`. Notice that you have to allocate the array's length plus 1, to account for the length indicator. It's probably a good idea to make a word like `: v len 1 + alloc dup rot rot ! ;`, so then you could just say `v : myVar $s ;`. The variable binding (which is just a word) is covered in the next section.

### Word definition, and control flow
#### `:`
Begins a word. Everything until the matching `:` (words can be nested) will be part of the word. Inside a word, there are some special words you can use: `$s` and `$fs`. At word definition time, `$s` will be replaced with the result of the stack being popped. `$fs` (fun `s`) is the same idea, except it pops a defined amount of elements from the stack. First it pops a scalar, which represents the number of elements to pop. Then, it pops that amount of _elements_, and puts them in the word definition.  
A nested word doesn't get defined until its parent word is called.
#### `g`
This is like APL's guard. If the top of the stack is non-zero, it returns. Otherwise, it pops the stack and continues. This, along with recursion, is how you do control flow.

## Example program
This is the factorial program.
`fac dup 1 = g dup 1 - fac * ;`
