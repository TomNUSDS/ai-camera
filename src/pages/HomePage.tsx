import {Grid, GridContainer, Link} from "@trussworks/react-uswds";

export const HomePage = () => {
  return (<>
    <main id="main-content" role="main">
      <section className="usa-section">
        <GridContainer>
            <Grid row><Grid col>
              See github repo for more information:
              <Link variant="external" href={'https://github.com/'}>Todo: add link to </Link>
            </Grid></Grid>
          <Grid row><Grid col>
            Use the menu at the top of the page to try different experiments.
          </Grid></Grid>
        </GridContainer>
      </section>
    </main>

  </>
);
}
