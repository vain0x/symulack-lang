const main = () => {
    console.log("hello stdout")
    console.error("world stderr")
    setTimeout(main, 1000)
}

main()
