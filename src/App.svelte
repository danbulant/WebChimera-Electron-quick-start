<script>
    import Player from "./components/player.svelte";
    import ipc from "./js/ipc";

    const location = ipc.args[0];
</script>

<Player {location} />